
 // percent encode by RFC3986
function percentEncode(str) {                                    

   // percent encodes unsafe chars, then it follows RFC3986 and percent encodes reserved characters in sqere brackets
   return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {

      // takes binary representation of every reserved char, converts it to hex string char and appends to "%"
      return `%${c.charCodeAt(0).toString(16)}`;  
   });

}

// form encodes an object (optionaly changes '+' for '%20')
function formEncode(dataObj, spaces) { 
   
   const pairs = [];
   let value;
   let key;
   let type;

   for (let name in dataObj) {

      type = typeof dataObj[name];
      
      if (dataObj.hasOwnProperty(name) && type !== 'function' && dataObj[name] !== 'null') { // only props 
         // in dataObj 
         key = percentEncode(name);   // encode property name

         if (type === 'object') {
            value = formEncode(dataObj[name], spaces); // form encode object
            value = percentEncode(value)          // since return value is string, percent encode it
         }
         else value = percentEncode(dataObj[name]) // property is not object, percent encode it

         if (!spaces) {
            key = key.replace(/%20/g, '+')
            value = value.replace(/%20/g, '+'); // substitute space encoding for +
         }

         pairs.push(`${key}=${value}`)
      }
   }

   return pairs.join('&');
}


// Builds the interface for creating and throwing custom errors
function CustomError() {

   this.messages = {}; // error messages place holder    

   // add custom error
   this.addCustomErrors = function (errors) {  // add custom error messages

      Object.getOwnPropertyNames(errors).map(function (name) {

         this.messages[name] = errors[name];
      }, this)
   }

   // throw custom error
   this.CustomError = function (name) {// uses built-in Error func to make custom err info

      let err = Error(this.messages[name]);      // take message text
      err.name = name;                          // set error name
      return err;
   }


}

function throwAsyncError(error) {
   if (Promise) return this.reject(error);  // if we have promise use reject for async Errors

   throw error;                            // other ways just throw it
}

export {
   percentEncode,
   formEncode,
   CustomError,
   throwAsyncError
}
