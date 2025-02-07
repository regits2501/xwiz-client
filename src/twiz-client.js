import AccessToken from './lib/twiz-client-accesstoken/src/AccessToken.js';
import Redirect from './lib/twiz-client-redirect/src/Redirect.js';
import RequestToken from './lib/twiz-client-requesttoken/src/RequestToken.js';
import request from './lib/twiz-client-request/src/request.js';



// factory for dynamic creation of an OAuth leg
function buildOAuthLeg(leg_) {

   /**
    * Creates an OAuth (1.0a) leg
   */
   class OAuthLegBuilder extends leg_ {
      constructor() {

         super(); // attach to any of oauth legs

         this.legParams = this[this.name]; // oauth params for this leg

         this.phases = {
            leg: '', // any of oauth legs (steps)
            api: '', // api calls (calls afther we've acquired access token)
            other: ''
         };

         const setOAuthLeg = function (args) {

            this.setUserParams(args); // parse user suplied params
            this.checkUserParams(this.name); // check the ones we need for this leg
            this.setNonUserParams(); // set calculated params

            this.OAuthParams('add', this.oauth, this.legParams); // add oauth params for this leg

            if (this.specificAction)
               this.specificAction(); // action specific to each leg 

            this.setRequestOptions(this.name);
            this.addQueryParams(this.phases.leg.toString(), this.name); // add leg params as url parameters

         }.bind(this);

         setOAuthLeg.toString = function () { return 'leg'; }; // redefine toString to reflect phase name

         const setAPI = function () {

            this.OAuthParams('remove', this.oauth, this.legParams); // remove oauth leg params
            this.OAuthParams('add', this.oauth, this.apiCall); // add params for api call

            /* istanbul ignore else */
            if (this.UserOptions.params) {
               this.oauth = this.OAuthParams('add', this.UserOptions.params, this.oauth);
            }

            this.addQueryParams(this.phases.api.toString(), this.UserOptions); // adding user params as url parameters

         }.bind(this);

         setAPI.toString = function () { return 'api'; };

         this.phases.leg = setOAuthLeg;
         this.phases.api = setAPI;


      }

      // define steps for an OAuth leg and following phase
      OAuthLegPlus(args, resolve, reject) {

         this.reject = reject; // make reference to reject for async functions that trow errors

         this.phases.leg(args); // standard oauth leg parameters added as url params
         this.phases.api(); // add parameters for api call (call after 3-leg dance) as url para

         /* istanbul ignore else */
         if (this.phases.other) { this.phases.other(); } // add any other parameters as url params

         this.send(this.options, this.callback.bind(this, resolve)); // send request to server
      }

      // send request to twiz-server with provided options
      send(options, cb) {

         options.callback = cb; // sets callback function
         options.reject = this.reject; // for promise (async) aware error throwing

         request(options);
      }
   }

   return new OAuthLegBuilder();
}

// define twiz OAuth steps
class TwizOAuth {
   constructor() {

      /*
        brings data immediately ( when access token is present on server)
        or brings request token (when no access token is present on server) and redirects
      */
      this.OAuth = function (args) {

         if (Promise)
            return this.promised(args, this.RequestTokenLeg()); // promisify request_token step (leg)

         this.RequestTokenLeg().OAuthLegPlus(args);
      };

      // Authorize redirection and continue OAuth flow (all 3 legs are hit) 
      this.finishOAuth = function (args) {
         if (Promise)
            return this.promised(args, this.AccessTokenLeg()); // promisify access token step

         this.AccessTokenLeg().OAuthLegPlus(args);
      };

      // Promisify the OAuth leg requests
      this.promised = function (args, leg) {
         return new Promise(function (resolve, reject) {
            leg.OAuthLegPlus(args, resolve, reject); // launch request
         });

      };

      // parse any session data from url (see OAuth 1.0a spec (https://oauth.net/core/1.0a/), section 6.2.3)
      this.getSessionData = function () {

         this.accessTokenLeg = (this.accessTokenLeg || this.AccessTokenLeg()); // if exist dont make new one
         return this.accessTokenLeg.getSessionData(); // return data from url
      };

      // define request token leg
      this.RequestTokenLeg = function () {

         const requestTokenLeg = buildOAuthLeg(RequestToken);

         // Set one more phase for request tokenleg, adds access token verification (verify credentials)
         requestTokenLeg.phases.other = function setVerifyCredentials() {

            let credentialOptions = {
               options: {
                  path: '/1.1/account/verify_credentials.json',
                  method: 'GET',
                  params: {
                     include_entities: false,
                     skip_status: true,
                     include_email: true
                  },
                  paramsEncoded: ''
               }
            };

            this.setUserParams(credentialOptions); // set user parameters;   

            this.oauth = this.OAuthParams('add', this.UserOptions.params, this.oauth); // add params to oauth
            this.addQueryParams('ver', this.UserOptions); // add query params for this phase

         }.bind(requestTokenLeg);


         requestTokenLeg.callback = function (resolve, res) {

            let authorize = new Redirect({
               newWindow: this.newWindow, // pass newWindow specs
               redirectionUrl: this.absoluteUrls[this.leg[1]],
               callback_func: this.callback_func, // callback function user supplied 
               reject: this.reject // for  promise (async) awere error throwing  
            });

            authorize.redirection(resolve, res);
         };

         return requestTokenLeg;
      };

      // define access token leg
      this.AccessTokenLeg = function () {

         const accessTokenLeg = buildOAuthLeg(AccessToken);

         // specific actiont this leg is authorizing tokens
         accessTokenLeg.specificAction = function () {

            this.setAuthorizedTokens();
         };

         // delivers response with error or data 
         accessTokenLeg.callback = function (resolve, res) {

            this.deliverData(resolve, res); //     
         };

         return accessTokenLeg;
      };
   }
}

function twizClient() {
   
   let twiz= new TwizOAuth();

   const head = {  // none of the 'this' references in 'twiz' are exposed to outside code
      OAuth: twiz.OAuth.bind(twiz),
      finishOAuth: twiz.finishOAuth.bind(twiz),
      getSessionData: twiz.getSessionData.bind(twiz)
   }

   return head;
}

export default twizClient;