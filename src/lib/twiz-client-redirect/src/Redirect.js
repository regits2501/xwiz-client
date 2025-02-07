import { CustomError, throwAsyncError } from '../../twiz-client-utils/src/utils.js';

/**
 * Creates request for redirection, second leg in OAuth 1.0a (after request token step).
*/
export default class Redirect {
   constructor(args) {

      this.newWindow = args.newWindow; // new tap / popup features
      this.url = args.redirectionUrl; // url where X will direct user after authorization
      this.callback_func = args.callback_func; // callback if there is no promise
      this.reject = args.reject;
      this.requestToken; // data from request token step   

      CustomError.call(this); // add CustomError feature
      this.addCustomErrors({
         noCallbackFunc: 'You must specify a callback function',
         callbackURLnotConfirmed: "Redirection(callback) url you specified wasn't confirmed by X"
      });
   }

   // redirect user to X for authorization (second OAuth leg)
   redirection(resolve, res) {

      this.res = res; // save response reference

      if (res.error || !res.data.oauth_token) { // on response error or on valid data deliver it to user 
         this.deliverData(resolve, res);
         return;
      }

      this.requestToken = res.data; // set requestToken data
      this.confirmCallback(res.data); // confirm that X accepted user's redirection(callback) url
      this.saveRequestToken(window.localStorage, res.data.oauth_token); // save token for url authorization 
      this.redirect(resolve); // redirect user to X 
   }

   deliverData(resolve, res) {
      // by callback function
      if (resolve) {
         resolve(res);
         return;
      }

      if (this.callback_func) { // when no promise is avalable invoke callback
         this.callback_func(res);
         return;
      }

      Redirect.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or
   }

   // make sure callback we provided was confirmed by X
   confirmCallback(sent) {

      if (sent.oauth_callback_confirmed !== "true")
         Redirect.throwAsyncError(this.CustomError('callbackURLnotConfirmed'));
   }

   // save the request token
   saveRequestToken(storage, token) {
      storage.requestToken_ = null; // erase any previous tokens, note null is actualy transformed to string "null"
      storage.requestToken_ = token; // save token to storage

   }

   // redirect to X with app's authorization token (received in first OAuth step)
   redirect(resolve) {

      const url = this.url + "?" + 'oauth_token=' + this.requestToken.oauth_token; // assemble url for second leg
      this.adjustResponse(this.res); // removes this.res.data                                                                               

      if (!this.newWindow) { // single page app
         this.SPA(resolve, url); // redirects current window to url
         return;

      }

      this.site(resolve, url); // site 

   }

   adjustResponse(res) {
      res.data = ''; // never send (request token) data to user 
   }

   // redirect the user in SPA (singel page app) use case
   SPA(resolve, url) {

      function redirectCurrentWindow() { window.location = url; } // redirects window we are currently in (no popUp)

      this.res.redirection = true; // since there is no newWindow reference indicate that redirection happens

      if (resolve) { // resolve promise
         resolve(this.res); // resolve with response object

         Promise.resolve()
            .then(function () {
               redirectCurrentWindow();
            });
         return;
      }

      if (this.callback_func) { // when no promise call user callback func
         this.callback_func(this.res); // run callback with token
         setTimeout(function () { redirectCurrentWindow(); }, 0); // redirect asap
         return;
      }

      Redirect.throwAsyncError(this.CustomError('noCallbackFunc')); // raise error when there is no promise or callback present
   }

   // redirect the user in Web site use case
   site(resolve, url) {
      let opened = this.openWindow(); // open new window/popup and save its reference
      opened.location = url; // change location (redirect)

      this.res.window = opened; // newWindow reference
      this.deliverData(resolve, this.res);

   }

   // opens the new window with specified parameters
   openWindow() {
      this.newWindow.window = window.open('', this.newWindow.name, this.newWindow.features);
      return this.newWindow.window;
   }

   static throwAsyncError = throwAsyncError;
}





