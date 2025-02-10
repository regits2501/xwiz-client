import OAuth from '../../OAuth/src/OAuth.js';
/**
 * Creates first OAuth leg 
*/
export default class RequestToken extends OAuth {
   constructor() {
      super();

      [this.name] = this.leg;
   }
}



