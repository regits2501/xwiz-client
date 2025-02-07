import OAuth from '../../twiz-client-oauth/src/OAuth.js';
/**
 * Creates first OAuth leg 
*/
export default class RequestToken extends OAuth {
   constructor() {
      super();

      [this.name] = this.leg;
   }
}



