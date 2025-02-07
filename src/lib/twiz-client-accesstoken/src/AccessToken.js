import OAuth from '../../twiz-client-oauth/src/OAuth.js';
import { throwAsyncError } from '../../twiz-client-utils/src/utils.js';

/**
 * Creates Access Token OAuth leg
*/
export default class AccessToken extends OAuth {
  constructor() {
    // Checks that oauth data is in redirection(callback) url, and makes sure
    // that oauth_token from url matches the one we saved in first step. 
    super();
    this.name = this.leg[2];

    this.redirectionUrlParsed; // redirection(callback) url parsing status
    this.redirectionData; // parsed data from redirection url

    this.loadedRequestToken; // place to load token 
    this.authorized; // redirection data that was autorized; 
    this.winLoc = window.location.href; // get current url

    this.addCustomErrors({
      verifierNotFound: '"oauth_verifier" string was not found in redirection(callback) url.',
      tokenNotFound: '"oauth_token" string was not found in redirection(callback) url.',
      tokenMissmatch: 'Request token and token from redirection(callback) url do not match',
      requestTokenNotSet: 'Request token was not set',
      requestTokenNotSaved: 'Request token was not saved. Check that page url from which you make request match your redirection_url.',
      noRepeat: "Cannot make another request with same redirection(callback) url",
      urlNotFound: "Current window location (url) not found",
      noSessionData: 'Unable to find session data in current url',
      spaWarning: 'Authorization data not found in url'
    });
  }

  static throwAsyncError = throwAsyncError;

  // set oauth token and verifier for access token request
  setAuthorizedTokens() {

    this.parseRedirectionUrl(this.winLoc); // parse url 

    /* istanbul ignore else */
    if (this.isAuthorizationDataInURL()) {
      this.authorize(this.redirectionData); // authorize token

      // set params for access token leg explicitly 
      this.oauth[this.prefix + 'verifier'] = this.authorized.oauth_verifier; // Put authorized verifier
      this.oauth[this.prefix + 'token'] = this.authorized.oauth_token; // Authorized token
    }
  }

  // parse the url we got from X redirection
  parseRedirectionUrl(url) {

    var str = this.getQueryString(url, /\?/g, /#/g); // get query string from url
    this.redirectionData = this.parseQueryParams(str); // parse parameters from query string

    this.redirectionUrlParsed = true; // indicate that the url was already parsed  
  }

  // get query string
  getQueryString(str, delimiter1, delimiter2) {

    if (!str) throw this.CustomError('urlNotFound');

    let start = str.search(delimiter1); // calculate from which index to take 
    let end;

    if (!delimiter2 || str.search(delimiter2) === -1) end = str.length; 
    else end = str.search(delimiter2);

    return str.substring(start, end);

  }

  parseQueryParams(str) {
    let arr = [];

    if (str[0] === "?") str = str.substring(1); // remove "?" if we have one at beggining

    arr = str.split('&') // make new array element on each "&" 
      .map(function (el) {
        let arr2 = el.split("="); // for each element make new array element on each "=" 
        return arr2;

      });

    return this.objectify(arr); // makes an object from query string parametars
  }

  objectify(array) {

    const data = {};
    let len = array.length;

    for (let i = 0; i < len; i++) {

      let arr = array[i];

      for (let j = 0; j < arr.length; j++) { // iterating though each of arrays in parsed

        if (j == 0) data[arr[j]] = arr[j + 1]; // if we are at element that holds name of property, 

      }
    }

    return data;
  }

  isAuthorizationDataInURL() {

    if (!this.redirectionData.oauth_token && !this.redirectionData.oauth_verifier) { // not a redirection url

      throw this.CustomError('spaWarning');
    }
    else return true;
  }
  
  // authorize redirection data
  authorize(redirectionData) {

    if (this.isRequestTokenUsed(window.localStorage))
      throw this.CustomError('noRepeat');

    if (!redirectionData.oauth_verifier) throw this.CustomError('verifierNotFound');
    if (!redirectionData.oauth_token) throw this.CustomError('tokenNotFound');

    this.loadRequestToken(window.localStorage, redirectionData); // load token from storage  

    // check that tokens match
    if (redirectionData.oauth_token !== this.loadedRequestToken) throw this.CustomError('tokenMissmatch');

    return this.authorized = redirectionData; // data passed checks, so its authorized;                     
  }

  // check if request token is already used
  isRequestTokenUsed(storage) {

    if (storage.requestToken_ === "null") return true; // token whould be "null" only when  loadRequestToken() 

    return false;
  }

  // load request token from local storage
  loadRequestToken(storage) {

    if (!storage.hasOwnProperty('requestToken_')) throw this.CustomError('requestTokenNotSaved');

    this.loadedRequestToken = storage.requestToken_; // load token from storage

    storage.requestToken_ = null; // since token is loaded, mark it appropriately

    if (!this.loadedRequestToken) throw this.CustomError('requestTokenNotSet');
  }

  // get session data from redirection url 
  getSessionData() {

    if (!this.redirectionUrlParsed)
      this.parseRedirectionUrl(window.location.href); // parse data from url 

    if (!this.redirectionData.data) { // return if no session data
      console.warn(this.messages['noSessionData']);
      return;
    }

    this.sessionData = this.parseSessionData(this.redirectionData.data); // further parsing of session data

    return this.sessionData;
  }

  // parse session data from query string
  parseSessionData(str) {
    if (/%[0-9A-Z][0-9A-Z]/g.test(str)) // See if there are percent encoded chars
      str = decodeURIComponent(decodeURIComponent(str)); // Decoding twice, since it was encoded twice (by OAuth 1.0a specification). See genSBS function.

    return this.parseQueryParams(str); // Making an object from parsed key/values.
  }


  deliverData(resolve, res) {

    if (resolve) {
      resolve(res);
      return;
    }

    if (this.callback_func) { // when no promise is avalable invoke callback
      this.callback_func(res);
      return;
    }

    AccessToken.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or
  }

}


