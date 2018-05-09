var twizClient = require('../src/twiz-client_instrumented.js');
var assert     = require('assert');

var twizClient = window.twizClient;
var twizlent = twizClient();

var serverUrl = 'http://localhost:5001/request_token';  // mock server address
var serverUrl2 = 'http://localhost:5001/access_token';

var args = {      
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
   'urls':{
      authorize: 'https://api.twitter.com/oauth/authenticate'
   } 
}



describe('twiz-client', function(){
 describe('haste', function(){
 
    describe('Success', function(){                        // test succesful cases
      it('gets request token', function(done){

        twizlent.haste(args)
        .then(function(o){
            assert.ok(!o.data, 'must not have any data when redirecting');
            assert.ok(!o.error, 'must not have eny error set when redirection') 
            if(o.window){                                  // check reference to opened new tab/ popup
              assert.ok(typeof o.window === 'object');
              done();
            }
        })
      })
 
      it('gets api data', function(done){
         args.server_url = serverUrl + '_api_data';         // set path that will simulate api data response
                    
         twizlent.haste(args)
         .then(function(o){
           
            assert.ok(!o.error, 'must not have eny error set when redirection');
            assert.ok(!o.window, 'redirection must not happen');

            if(o.data){ 
               assert.ok(typeof o.data === 'object');
               done()
            } 
             
         })
      })   

    })

    describe('Failure', function(){                        // test when there is an error
      it('request error handled', function(done){          // simulate error

         args.server_url = serverUrl + '_error';           // set path that will simulate error response

         twizlent.haste(args)
         .then(function(o){
            assert.ok(!o.data, 'must not have any data when error happens');
            assert.ok(!o.window,' redirection must not happen'); // should not get any reference to opened window
 
            if(o.error){
               assert.ok(typeof o.error === 'object') 
               done()
            }
         })
      })
    })
 })

  describe('flow (oauth flow)', function(){                 // test the access token step and data retreval
     describe('Success', function(){              
 
      it('gets api data', function(done){
         args.server_url = serverUrl2                       // set path that will simulate api data response
         twizlent.flow(args)
         .then(function(o){
           
            assert.ok(!o.error, 'must not have eny error set when data is present');

            if(o.data){ 
               assert.ok(typeof o.data === 'object');       // we have data
               done()
            } 
             
         })
      })   

    })

    describe('Failure', function(){
      it('request error handled', function(done){            // simulate error

         args.server_url = serverUrl + '_error';             // set path that will simulate error response
         window.localStorage.requestToken_ = 'longAlphaNum1' // set again request token since it was set to null
                                                             // in previous call of flow()
         twizlent.flow(args)
         .then(function(o){
            assert.ok(!o.data, 'must not have any data when error happens');
           
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
