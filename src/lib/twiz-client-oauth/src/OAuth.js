import Options from '../../twiz-client-options/src/Options.js';
import { percentEncode, formEncode } from '../../twiz-client-utils/src/utils.js';
const btoa = window.btoa  // use browser's btoa 

/**
 * Defines the OAuth 1.0a
*/
export default class OAuth extends Options {
   constructor() {
      super();

      this.leadPrefix = "OAuth "; // leading string afther all key-value pairs go. Notice space at the end. 
      this.prefix = "oauth_"; // Prefix for each oauth key in a http request

      this.oauth = {}; // Holds parameters that are used to generate SBS and AH
      this.oauth[this.prefix + 'consumer_key'] = ""; // This is very sensitive data. Server sets the value.
      this.oauth[this.prefix + 'signature'] = ""; // This value is also inserted in server code.
      this.oauth[this.prefix + 'nonce'] = ""; // Session id, twitter api uses this to determines duplicates
      this.oauth[this.prefix + 'signature_method'] = ""; // Signature method we are using
      this.oauth[this.prefix + 'timestamp'] = ""; // Unix epoch timestamp
      this.oauth[this.prefix + 'version'] = ""; // all request use ver 1.0

      this[this.leg[0]] = {}; // oauth param for request token step
      this[this.leg[0]][this.prefix + 'callback'] = ''; // User is return to this link, 



      // if approval is confirmed   
      // this[this.leg[1]] = {}                     // there is no oauth params for authorize step. request_token                                                    // is sent as redirection url query parameter.
      this[this.leg[2]] = {}; // oauth params for access token step
      this[this.leg[2]][this.prefix + 'token'] = '';
      this[this.leg[2]][this.prefix + 'verifier'] = '';

      this.apiCall = {};
      this.apiCall[this.prefix + 'token'] = ''; // oauth param for api calls. Here goes just users acess token


      // generate OAuth parameters  (inserted by server code)
      this.OAuthParams = function (action, o1, o2) {
         Object.getOwnPropertyNames(o2)
            .map(function (key) {
               if (action === 'add') o1[key] = o2[key]; // add property name and value
               else delete o1[key]; // removes property name
            });
         return o1;
      };


   }

   // set OAuth params
   setNonUserParams() {
      this.setSignatureMethod();
      this.setNonce();
      this.setTimestamp();
      this.setVersion();
   }

   setSignatureMethod(method) {
      this.oauth[this.prefix + 'signature_method'] = method || "HMAC-SHA1";
   }

   setVersion(version) {
      this.oauth[this.prefix + 'version'] = version || "1.0";
   }

   // set X session identifier (nonce) and return base64 encoding of that string, striped of "=" sign.
   setNonce() {
      
      const seeds = "AaBb1CcDd2EeFf3GgHh4IiJjK5kLl6MmN7nOo8PpQqR9rSsTtU0uVvWwXxYyZz";
      let nonce = "";

      for (let i = 0; i < 31; i++) {
         nonce += seeds[Math.round(Math.random() * (seeds.length - 1))]; // pick a random ascii from seeds string
      }

      nonce = btoa(nonce).replace(/=/g, ""); // encode to base64 and strip the "=" sign

      this.oauth[this.prefix + 'nonce'] = nonce;
   }

   setTimestamp() {
      this.oauth[this.prefix + 'timestamp'] = (Date.now() / 1000 | 0) + 1; // cuting off decimal part 
   }

   addQueryParams(phase, leg) {

      this.options.queryParams[phase + 'Host'] = this.twtUrl.domain;

      this.options.queryParams[phase + 'Path'] = phase === 'leg' ? this.twtUrl.path + leg :
                                                                    this.UserOptions.path +
                                                                    this.UserOptions.paramsEncoded;

      this.options.queryParams[phase + 'Method'] = phase === 'leg' ? this.httpMethods[leg] : this.UserOptions.method;
      this.options.queryParams[phase + 'SBS'] = this.genSignatureBaseString(leg);
      this.options.queryParams[phase + 'AH'] = this.genAuthorizationHeaderString();
   }

   // generate Signature Base String (SBS)
   genSignatureBaseString(leg) {

      this.signatureBaseString = '';

      const a = [];
      for (let name in this.oauth) { // take every oauth param name
         if (this.oauth.hasOwnProperty(name)) a.push(name);
      }

      a.sort(); // sorts alphabeticaly

      let pair; // key value pair
      let key; // parameter name
      let value; // parameter value   

      // Collects oauth params
      for (let i = 0; i < a.length; i++) { // Percent encodes every key value, add "=" between those, and between each pair of key/value it add "&" sign.
         
         key = a[i]; // Thakes key that was sorted alphabeticaly
         
         switch (key) { // In case of consumer and user keys we leave them to server logic
            case "oauth_callback": // Callback url to which users are redirected by twitter    

               // Check to see if there is data to append to calback as query string:
               value = this.session_data ? this.appendToCallback(this.session_data) :
                  this.oauth[this.prefix + 'callback'];
               break;
            case "oauth_consumer_key":
               value = ""; // Sensitive data we leave for server to add
               break;
            case "oauth_signature":
               continue; // We dont add signature to singatureBaseString at all (notice no break)
            default:
               value = this.oauth[key]; // Takes value of that key
         }

         pair = percentEncode(key) + "=" + percentEncode(value); // Encodes key value and inserts "=" between

         if (i !== a.length - 1) pair += "&"; // Dont append "&" on last pair    
         this.signatureBaseString += pair; // Add pair to SBS
      }

      let method; // collecting the reqest method and url
      let url;

      if (typeof leg === 'string') { // we are in 3-leg dance, take well known params

         method = this.httpMethods[leg]; // get the method for this leg
         method = method.toUpperCase() + "&"; // upercase the method, add "&"

         url = this.absoluteUrls[leg]; // get the absolute url for this leg of authentication
         url = percentEncode(url) + "&"; // encode the url, add "&".
      }
      else { // 'leg' is the options object user provided     

         method = leg.method.toUpperCase() + "&"; // Upercase the method, add "&"
         url = this.twtUrl.protocol + this.twtUrl.domain + leg.path;

         // Get the absoute url for api call + user provided path
         url = percentEncode(url) + "&"; // Encode the url, add "&".
      }

      // finaly assemble the sbs string PercentEncoding again the signature base string
      this.signatureBaseString = method + url + percentEncode(this.signatureBaseString);

      return this.signatureBaseString;
   }

   // generate Auhtorization Header String (AHS)
   genAuthorizationHeaderString() {
      const a = [];

      Object.getOwnPropertyNames(this.oauth)
         .forEach(function (el) { if (!/^oauth/.test(el)) delete this[el]; }, this.oauth); // delete none oauth params

      for (let name in this.oauth) {
         a.push(name);
      }

      a.sort(); // Aphabeticaly sort array of property names

      let headerString = this.leadPrefix; // Adding "OAuth " as prefix
      let key; // Temp vars
      let value;
      let pair;

      for (let i = 0; i < a.length; i++) { // iterate oauth  

         key = a[i]; // Take the key name (sorted in a)

         value = this.oauth[key]; // Get it from oauth object

         key = percentEncode(key); // Encode the key
         value = "\"" + percentEncode(value) + "\""; // Adding double quotes to value

         pair = key + "=" + value; // Adding "=" between
         if (i !== (a.length - 1)) pair = pair + ", "; // Add trailing comma and space, until end

         headerString += pair;
      }

      return headerString;
   }

   // append query parameters to oauth_callback url
   appendToCallback(data, name) {

      if (!name) name = "data";

      let callback = this.oauth[this.prefix + 'callback'];
      let fEncoded = formEncode(data, true);

      let queryString = name + '=' + percentEncode(fEncoded); // Make string from object then                                                                                  // percent encode it.  

      if (!/\?/.test(callback)) callback += "?"; // Add "?" if one not exist
      else queryString = '&' + queryString; // other queryString exists, so add '&' to this qs

      this.oauth[this.prefix + 'callback'] = callback + queryString; // Add queryString to callback

      return this.oauth[this.prefix + 'callback'];
   }
}










