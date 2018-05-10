var twizClient = require('../src/twiz-client_instrumented.js');
var assert     = require('assert');

var twizClient = window.twizClient;
var twizlent = twizClient();

var serverUrl = 'http://localhost:5001/request_token';  // mock server address
var serverUrl2 = 'http://localhost:5001/access_token';

var args; 

beforeEach(function(){
  args = {      
    "server_url": serverUrl,
    "redirection_url":"test/redirectionPage.html",
     
    "session_data": {                                    // redirection data
       'quote':  'Train yourself to let go everthing you fear to lose', 
       'author': 'Yoda', 
       'id': 209
    }, 
                                     
    'new_window':{                                      // new tab / popup options
      'name': 'nw',
      'features':'resizable=yes,height=613,width=400,left=400,top=300'
    },  
    'options':{ 
      'method': 'POST',               // GET
      'path': 'statuses/update.json', // users/search.json
      'params':{
         status: '“Train yourself to let go of everything you fear to lose.” ~ Yoda'
      }
    },
    'endpoints':{
      authorize: 'authenticate'
    } 
  }
})



describe('twiz-client', function(){
 describe('OAuth', function(){
 
    describe('Success', function(){                        // test succesful cases
      it('gets request token (redirects)', function(done){

        twizlent.OAuth(args)
        .then(function(o){ 
            assert.ok(!o.data, 'must not have any data when redirecting');
            assert.ok(!o.error,'must not have eny error set when redirecting');
            assert.ok(o.xhr, 'must have xhr (request/response) reference');
            
            if(o.window){                                  // check reference to opened new tab/ popup
              assert.ok(typeof o.window === 'object');
              done();
            }
        })
      })
 
      it('gets api data', function(done){
         args.server_url = serverUrl + '_api_data';         // set path that will simulate api data response
                    
         twizlent.OAuth(args)
         .then(function(o){
           
            assert.ok(!o.error, 'must not have eny error set on api data');
            assert.ok(!o.window,'must not have window reference on api data');
            assert.ok(!o.redirection, 'must not have redirection indication on api data');
            assert.ok(o.xhr, 'must have xhr (request/response) reference');

            if(o.data){ 
               assert.ok(typeof o.data === 'object');
               done()
            } 
             
         })
      })   
                                   // test streaming from OAuth(..) - request token step      
      
      it('stream', function(done){
         var responseData = 'cat moves tail';               // sever will send this data
         args.stream = true;                              // initiate stream behaviour
         args.options.beforeSend = function(xhr){  

              xhr.onprogress = function(){                     // define chunk by chunk handler
                 assert.equal(xhr.responseText, responseData); // check sent data
                 
              }
         }

         twizlent.OAuth(args)
         .then(function(o){  
                                         
              assert.equal(o.data, responseData);           // check sent data
              done();           
         }, function rejected(err){
            console.log('err in PROMISE: ', err)
         })       
     
      })
    
       // test chunk by chunk stream 
       

      it('chunk by chunk', function(done){
         var responseData = 'cat moves tail';
         
         args.stream = 'chunked';            // only to make test sever hit the right streaming functio
                                             // value should be 'true'
         args.options.chunked = true;
         args.options.beforeSend = function(xhr){
                 var begin;
                 var end;
                 xhr.onprogress = function(){
                     end = xhr.responseText.length;                    
                     var data = xhr.responseText.slice(begin, end)
                     assert.equal(data, responseData);
 
                     
                 }
            
         }
  
         twizlent.OAuth(args)
         .then(function fullfiled(o){
                     // must not be called
         }, function rejected(err){ 
             assert.ok(err.name === 'chunkedResponseWarning')
             done();
         }) 
      })
       

    })

    describe('Failure', function(){                        // test when there is an error
      it('request error handled', function(done){          // simulate error

         args.server_url = serverUrl + '_error';           // set path that will simulate error response

         twizlent.OAuth(args)
         .then(function(o){
            assert.ok(!o.data, 'must not have any data when error happens');
            assert.ok(!o.window,'must not have any window referenece when error happens');
            assert.ok(!o.redirection, 'must not have redirection indication when error happens');
            assert.ok(o.xhr, 'must have xhr (request/response) reference');
                                                                                  
            if(o.error){
               assert.ok(typeof o.error === 'object') 
               done()
            }
         })
      })
    })
 })

  describe('finishOAuth (oauth flow)', function(){          // test the access token step and data retreval
     describe('Success', function(){              
 
     it('gets api data', function(done){
         args.server_url = serverUrl2                       // set path that will simulate api data response
         twizlent.finishOAuth(args)
         .then(function(o){
            assert.ok(!o.error, 'must not have eny error set when api data is present');
            assert.ok(!o.window,'must not have any window referenece on api data');
            assert.ok(!o.redirection, 'must not have redirection indication on api data');
            assert.ok(o.xhr, 'must have xhr (request/response) reference');

            if(o.data){ 
               assert.ok(typeof o.data === 'object');       // we have data
               done()
            } 
             
         })
      })   
  
      it('stream', function(done){                           // test stream consuming in xhr.onprogress()

         window.localStorage.requestToken_ = 'longAlphaNum1' // make request fresh, so we dont get 'noRepeat' error 
         var responseData = 'cat moves tail';               // sever will send this data
         args.stream = 'true';                              // initiate stream behaviour
         args.options.beforeSend = function(xhr){  

              xhr.onprogress = function(){                  // define chunk by chunk handler
                 assert.equal(xhr.responseText, responseData); // check sent data
                 
              }
         }

         twizlent.finishOAuth(args)
         .then(function(o){
              assert.equal(o.data, responseData);              // check sent data
              done();           
         }, function rejected(err){
           // console.log('err in PROMISE: ', err)
         })       
     
      })

      it('chunk by chunk', function(done){                   // test chunk by chunk stream consuming in onprogress(..)
         window.localStorage.requestToken_ = 'longAlphaNum1' // make request fresh, so we dont get 'noRepeat' error 
         var responseData = 'cat moves tail';
         
         args.stream = 'chunked';            // only to make test sever hit the right streaming functio
                                             // value should be 'true'

         args.options.chunked = true;
         args.options.beforeSend = function(xhr){
            var begin;
            var end;
            xhr.onprogress = function(){
               end = xhr.responseText.length;                    
               var data = xhr.responseText.slice(begin, end);
                     assert.equal(data, responseData);
             }
            
         }
         
         twizlent.finishOAuth(args)      // make request
         .then(function fullfiled(o){
                     // must not be called
         }, function rejected(err){
             assert.ok(err.name === 'chunkedResponseWarning')
             done();
         }) 
      })
    })

    describe('Failure', function(){
      it('request error handled', function(done){            // simulate error

         args.server_url = serverUrl + '_error';             // set path that will simulate error response
         window.localStorage.requestToken_ = 'longAlphaNum1' // set again request token since it was set to null
                                                             // in previous call of finishOAuth()
         twizlent.finishOAuth(args)
         .then(function(o){
            assert.ok(!o.data, 'must not have any data when error happens');
            assert.ok(!o.window,'must not have any window referenece when error happens');
            assert.ok(!o.redirection, 'must not have redirection indication when error happens');
            assert.ok(o.xhr, 'must have xhr (request/response) reference');

            if(o.error){
               assert.ok(typeof o.error === 'object')         // has error object
               done()
            }
         })
      })
    })

  })

  describe('getSessionData', function(){                       // test getting of session data from url

      it('session data', function(){
         var sdata = twizlent.getSessionData();                 
         var sdata2 = twizlent.getSessionData();               // get second time, make sure its consistent
         assert.ok(typeof sdata === 'object')
         assert.deepStrictEqual(sdata, sdata2)                 
      })
  })
})

// We did not test twizClient() for SPA (single page apps) scenario where current page (with mocha test) gets redirectied to another (non mocha) page. That case is triggered when there is no 'newWindow' object.

// Also it is not tested when there is no Promise avalable and user is using callback function instead like so: 'args.callback_func = function Foo(){...}'. Because setting Promise to 'undefined' breaks Pupeteer's execution context that uses promises. Those two cases need to be tested in an integration test. 
