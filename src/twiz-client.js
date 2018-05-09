(function() {
  'use strict'

  var RequestToken = require('twiz-client-requesttoken');
  var Redirect     = require('twiz-client-redirect');
  var AccessToken  = require('twiz-client-accesstoken');

  var request = require('twiz-client-request');

  function buildOAuthLeg (leg_){
 
      function OAuthLegBuilder(){
         
         leg_.call(this);                   // attach to any of oauth legs
        
         this.legParams  = this[this.name]; // oauth params for this leg

         this.phases = {                             // OAuth leg build phases

            leg:   '',                // any of oauth legs (steps)
            api:   '',                // api calls (calls afther we've acquired access token)
            other: ''
         }
          
         var setOAuthLeg = function(args) {                       // set oauth leg params as url (query) params
         
            this.setUserParams(args);                             // parse user suplied params
            this.checkUserParams(this.name);                      // check the ones we need for this leg
            this.setNonUserParams();                              // set calculated params
         
            this.OAuthParams('add', this.oauth, this.legParams);  // add oauth params for this leg
           
            if(this.specificAction)
              this.specificAction();                                // action specific to each leg 

            this.setRequestOptions(this.name);
            this.addQueryParams(this.phases.leg.toString(), this.name);// add leg params as url parameters

         }.bind(this);

         setOAuthLeg.toString = function(){ return 'leg'};    // redefine toString to reflect phase name

         var setAPI = function (){                            // setting (twitter) api request options
            
            this.OAuthParams('remove', this.oauth, this.legParams); // remove oauth leg params
            this.OAuthParams('add',  this.oauth, this.apiCall);     // add params for api call
         
            if(this.UserOptions.params)               
              this.oauth = this.OAuthParams('add', this.UserOptions.params, this.oauth);
            

            this.addQueryParams(this.phases.api.toString(), this.UserOptions); // adding user params as url para

         }.bind(this);

         setAPI.toString = function(){ return 'api' }
         
         this.phases.leg = setOAuthLeg;
         this.phases.api = setAPI;
         

      }
   
      OAuthLegBuilder.prototype = Object.create(leg_.prototype);       // link prototype of any oauth leg
  
      OAuthLegBuilder.prototype.OAuthLegPlus = function(args, resolve){ // add query params for each phase

         this.phases.leg(args);              // standard oauth leg parameters added as url params
         this.phases.api();                  // add parameters for api call (call after 3-leg dance) as url para
         if(this.phases.other) this.phases.other();     // add any other parameters as url params
         
         //console.log('leg ', this.name)
         // console.log('this.phases: ', this.phases);
         this.send(this.options, this.callback.bind(this, resolve)); // send request to server
      }

      OAuthLegBuilder.prototype.send = function (options, cb){     // was (vault, resolve, leg) 
        // console.log('request SENT +')
       
        options.callback = cb // sets callback function
        
       // console.log("OPTIONS ->", options);
 
         request(options);  
      }
  
      return new OAuthLegBuilder();
   }

   function twizClient (){   
     
     this.haste = function(args){ // Brings data immediately ( when access token is present on server), or
                                  // brings request token (when no access token is present on server) and redirects
         if(Promise)
           return this.promised(args, this.RequestTokenLeg())  // promisify request_token step (leg)
         
         this.RequestTokenLeg().OAuthLegPlus(args)          
     }

     
     this.flow = function(args){ // Authorizes redirection and continues OAuth flow (all 3 legs are hit) 
         if(Promise)
           return this.promised(args, this.AccessTokenLeg());  // promisify access token step

         this.AccessTokenLeg().OAuthLegPlus(args);
     }

     this.promised = function(args, leg){                        // Promisifies the OAuth leg requests
         return new Promise(function (resolve){          // return promise
                    leg.OAuthLegPlus(args, resolve);             // launch request
         });

     }
     
     this.getSessionData = function(){                           // Parse any session data from url
                                                                 
        this.accessTokenLeg = (this.accessTokenLeg || this.AccessTokenLeg()) // if exist dont make new one
        return this.accessTokenLeg.getSessionData();                         // return data from url
     }

     this.RequestTokenLeg = function() {
        
        var requestTokenLeg = buildOAuthLeg(RequestToken);

        requestTokenLeg.phases.other = function setVerifyCredentials(){ // sets one more phase for request token
                                                                        // leg. Adds access token verification 
             
          // console.log('in setVErifyCredentials')
           var credentialOptions = {                    // verify credential(access token) options
              options:{ 
                 path: 'account/verify_credentials.json',
                 method: 'GET',
                 params:{               // avalable params for this api endpoint (server decides which are used)
                   include_entities: false,
                   skip_status: true,
                   include_email: true
                 },
                 paramsEncoded:'' 
             }
           }
        
           this.setUserParams(credentialOptions);                  // use this function to set UserOptions;   
           
           this.oauth = this.OAuthParams('add', this.UserOptions.params, this.oauth);  // add params to oauth
           this.addQueryParams('ver', this.UserOptions);          // add query params for this phase

        }.bind(requestTokenLeg)
        

        requestTokenLeg.callback = function(resolve, error, sentData){  // afther request token, redirect
             
            var authorize = new Redirect({                     // make redirect instance
               newWindow:      this.newWindow,                 // pass newWindow specs
               redirectionUrl: this.absoluteUrls[this.leg[1]], 
               callback_func:  this.callback_func              // callback function user supplied 
            })

            authorize.redirection(resolve, error, sentData);   
        }
 
        return requestTokenLeg;       
     }  

     this.AccessTokenLeg = function(){                     // create and define access token leg

        var accessTokenLeg = buildOAuthLeg(AccessToken);   
        accessTokenLeg.specificAction = function(){        // specific actionto this leg is authorizing tokens

           this.setAuthorizedTokens();
        }
  
        accessTokenLeg.callback = function(resolve, error, sentData){ // delivers error or data to user
        
           //if(error) console.log('after access_token (error):', error)
           //else console.log('after access_token (data):', sentData);

           this.deliverData(resolve, { 'error': error, 'data': sentData });    // delivers to user     

        }

        return  accessTokenLeg;
     }
      
         
   }
   
   function twiz(){
      var r = new twizClient(); 
      
      var head = {
         haste :         r.haste.bind(r),
         flow:           r.flow.bind(r),
         getSessionData: r.getSessionData.bind(r)
      }
      
      return head ; 
   }
   
  if(typeof window === 'object' && window !== 'null') window.twizClient = twiz 
  else if(typeof module ==='object' && module !== 'null') module.exports = twiz;
//  console.log('module.exports: ', module.exports);

})();  





