import { CustomError, formEncode } from "../../twiz-client-utils/src/utils";

/**
 * Creates options for a request we send to twiz-server
*/
export default class Options {
  constructor() {

    // Names of each leg (step) in 3-leg OAuth to X. Names are also url path ends like: http://api.x.com/oauth/request_token
    this.leg = ["request_token", "authorize", "access_token"];
    this.httpMethods = {}; // This is the current sequence of http methods we use in 3-leg authentication 
    this.httpMethods[this.leg[0]] = "POST";
    this.httpMethods[this.leg[1]] = "GET";
    this.httpMethods[this.leg[2]] = "POST";

    this.twtUrl = {
      "protocol": "https://",
      "domain": "api.x.com",
      "path": "/oauth/", // 'path' is actualy just a part of the complete path used in 3-leg dance 
    };

    this.apiUrl = this.twtUrl.protocol + this.twtUrl.domain + this.twtUrl.path; // here we store absolute url                                                                                   // without leg.

    this.absoluteUrls = {}; // Here we put together the complete url for each leg (step) in authentication
    this.absoluteUrls[this.leg[0]] = this.apiUrl + this.leg[0];
    this.absoluteUrls[this.leg[1]] = this.apiUrl + this.leg[1];
    this.absoluteUrls[this.leg[2]] = this.apiUrl + this.leg[2];

    this.UserOptions = {
      host: '',
      path: '',
      method: '',
      params: '',
      paramsEncoded: '',
      SBS: '',
      AH: '',
      body: '',
      encoding: ''
    };

    this.options = {}; // request options we send to server
    this.options.url = '';
    this.options.method = '';
    this.options.queryParams = {
      legHost: '', // oauth leg params     
      legPath: '',
      legMethod: '',
      legSBS: '',
      legAH: ''
    };

    this.options.body = '';
    this.options.encoding = '';
    this.options.beforeSend = '';
    this.options.callback = ''; // Callback function
    this.options.chunked = '';
    this.options.parse = true; // if json string, parse it


    CustomError.call(this); // add CustomError
    this.addCustomErrors({
      redirectionUrlNotSet: "You must provide a redirection_url to which users will be redirected.",
      noStringProvided: "You must provide a string as an argument.",
      serverUrlNotSet: "You must proivide server url to which request will be sent",
      optionNotSet: "Check that \'method\' and \'path\' are set."
    });


  }

  setUserParams(args) {
    let temp;
    for (let prop in args) { // iterate trough any user params
      temp = args[prop];

      switch (prop) {
        case "server_url": // url of the twiz-server
          this.server_url = temp;
          break;
        case "redirection_url": // this is the url to which user gets redirected by X in OAuth
          this[this.leg[0]].oauth_callback = temp;
          break;
        case "method": // set user provided method (for comunication with proxy server)
          this.method = temp;
          break;
        case "new_window": // object that holds properties for making new window(tab/popup)
          this.newWindow = {};
          for (let data in temp) {
            /* istanbul ignore else */
            if (temp.hasOwnProperty(data)) {
              switch (data) {
                case "name":
                  this.newWindow[data] = temp[data];
                  break;
                case "features":
                  this.newWindow[data] = temp[data];
                  break;
              }
            }
          }
          break;
        case 'callback': // user supplied callback function (called if Promise is not available)
          this.callback_func = temp;
          break;
        case "session_data":
          this.session_data = temp;
          break;
        case "stream":
          this.options.queryParams.stream = temp; // set stream indication in query params
          break;
        case "options": // X request options
          for (let opt in temp) {
            switch (opt) {
              case "method":
                this.UserOptions[opt] = temp[opt];
                break;
              case "path":
                this.UserOptions[opt] = temp[opt];
                break;
              case "params":
                this.UserOptions[opt] = temp[opt];
                this.UserOptions.paramsEncoded = "?" + formEncode(temp[opt], true);
                break;
              case "body":
                this.UserOptions[opt] = temp[opt];
                break;
              case "encoding":
                this.UserOptions[opt] = temp[opt];
                break;
              case "beforeSend":
                this.UserOptions[opt] = temp[opt];
                break;
              case "chunked":
                this.UserOptions[opt] = temp[opt];
                break;
            }
          }
          break;
        case "endpoints": // when we get urls object, we check for urls provided
          // for each leg (part) of the 3-leg authentication.
          for (let leg in temp) {
            switch (leg) {
              case "request_token":
                this.absoluteUrls[leg] = this.apiUrl + temp[leg]; // if leg is request_token, update with new url    
                break;
              case "authorize":
                this.absoluteUrls[leg] = this.apiUrl + temp[leg];
                break;
              case "access_token":
                this.absoluteUrls[leg] = this.apiUrl + temp[leg];
                break;
            }
          }
          break;
      }
    }

  }

  // check for needed params
  checkUserParams(leg) {

    if (!this.server_url) throw this.CustomError('serverUrlNotSet'); // We need server url to send request 
    if (leg === this.leg[0]) this.checkRedirectionCallback(); // Check only in request token step 
    this.checkApiOptions();

  }

  // check that redirection url is set (oauth_callback)
  checkRedirectionCallback() {
    if (!this[this.leg[0]].oauth_callback) throw this.CustomError('redirectionUrlNotSet'); // throw an error if callback is not set
   
  }

  checkApiOptions() {
    for (let opt in this.UserOptions) {
      if (opt === 'path' || opt == 'method') { // mandatory params set by user
        if (!this.UserOptions[opt]) // check option 
          throw this.CustomError('optionNotSet');

      }
    }
  }

  // set request options we send to twiz-server
  setRequestOptions(leg) {

    this.options.url = this.server_url; // server address
    this.options.method = this.method || this.httpMethods[leg]; // user set method or same as leg method
    this.options.body = this.UserOptions.body; // api call have a body, oauth dance requires no body
    this.options.encoding = this.UserOptions.encoding; // encoding of a body
    this.options.beforeSend = this.UserOptions.beforeSend; // manipulates request before it is sent
    this.options.chunked = this.UserOptions.chunked; // indicates chunk by chunk stream consuming
  }
}


