var test = require('tap').test;
var Options = require('../src/Options');


var mockOptions = {  

  leg: [ 'request_token', 'authorize', 'access_token' ],
  httpMethods: { request_token: 'POST', authorize: 'GET', access_token: 'POST' },
  
  twtUrl: { 
     protocol: 'https://',
     domain: 'api.twitter.com',
     path: '/oauth/',
     api_path: '/1.1/' },
  
  apiUrl: 'https://api.twitter.com/oauth/',
  
  absoluteUrls: 
   { request_token: 'https://api.twitter.com/oauth/request_token',
     authorize: 'https://api.twitter.com/oauth/authorize',
     access_token: 'https://api.twitter.com/oauth/access_token' },
  lnkLabel: { name: 'twiz_', data: { id: 'he who dares ' } },
  
  UserOptions: {
     host: '',
     path: '',
     method: '',
     params: '',
     paramsEncoded: '',
     SBS: '',
     AH: '',
     body: '',
     encoding: '' 
  },
  options: { 
     url: '',
     method: '',
     queryParams: { legHost: '', legPath: '', legMethod: '', legSBS: '', legAH: '' },
     body: '',
     encoding: '',
     beforeSend: '',
     callback: '',
     chunked: '',
     parse: true 
  }
 
}


var ro = new Options();  // request options
test('Options', function(t){

 
 test('3 legs of OAuth',function(t){ // check names of each leg 
   t.plan(1);
   t.deepEqual(ro.leg, mockOptions.leg, '3 legs of OAuth present');
 })

 test('request options', function(t){ // check taht we have request options
    t.plan(1)
    t.deepEqual(ro.options, mockOptions.options, 'request options supported')
 }); 
 test('user specified options', function(t){ // check that user options are in place
    t.plan(1)
    t.deepEqual(ro.UserOptions, mockOptions.UserOptions, 'user options supported')
 }); 
 
 test('twitter url parts',function(t){  // check partitioning of twitter url
   t.plan(8)
  
   t.ok(typeof ro.twtUrl.protocol === 'string','protocol string present')
   t.equals(ro.twtUrl.protocol, mockOptions.twtUrl.protocol, 'protocol')

    
   t.ok(typeof ro.twtUrl.domain === 'string','domain string present')
   t.equals(ro.twtUrl.domain, mockOptions.twtUrl.domain, 'domain');

   t.ok(typeof ro.twtUrl.path === 'string','path string present')
   t.equals(ro.twtUrl.path, mockOptions.twtUrl.path, 'path')
  

   t.ok(typeof ro.twtUrl.api_path === 'string','api path string present')
   t.equals(ro.twtUrl.api_path, mockOptions.twtUrl.api_path, 'api path ');

 })

 test('must specify OAuth endpoint urls', function(t){ // chech complete urls for each  leg
    test('request_token url',function(t){
      t.plan(2) 
      t.ok(typeof ro.absoluteUrls.request_token ===  'string', 'url string present');
      t.equals(ro.absoluteUrls.request_token, mockOptions.absoluteUrls.request_token, 'request token url specified')  
    })

    test('authorize url',function(t){
      t.plan(2);
      t.ok(typeof ro.absoluteUrls.authorize ===  'string', 'url string present');
      t.equals(ro.absoluteUrls.authorize, mockOptions.absoluteUrls.authorize, 'access_token url specified')
    })

   test('access_token url', function(t){
     t.plan(2);
     t.ok(typeof ro.absoluteUrls.access_token ===  'string', 'url string present');
     t.equals(ro.absoluteUrls.access_token, mockOptions.absoluteUrls.access_token, 'authorize url specified')
     
   })
   t.end();
  })

 test('http methods for each OAuth leg',function(t){ // check methods for each leg

  test('request_token method', function(t){ 
    t.plan(2);
    t.ok(typeof ro.httpMethods.request_token ===  'string', 'method string present');
    t.deepEqual(ro.httpMethods.request_token, mockOptions.httpMethods.request_token, 'http method for request token present ');
  })

  test('authorize method',function(t){
    t.plan(2);
    t.ok(typeof ro.httpMethods.authorize ===  'string', 'method string present');
    t.deepEqual(ro.httpMethods.authorize, mockOptions.httpMethods.authorize, 'http method for authorize present ');
  })

  test('access_token method', function(t){
    t.plan(2);
    t.ok(typeof ro.httpMethods.access_token ===  'string', 'method string present');
    t.deepEqual(ro.httpMethods.access_token, mockOptions.httpMethods.access_token, 'http method for access_token present ');
   })

   t.end()
 })
 
  test('set user params', function(t){
   
    var userOptions = {
        method: 'POST',
        path:'statuses/update.json',
        params:{
          status: "A bug walks carelessly."
        },
        body: 'of an animal',
        encoding: 'json',
        beforeSend: function(){},
        chunked: true
    }

    var args = {
       server_url: 'https://myserver.com',
       method: 'GET',
       redirection_url: 'https://myapp.com/redirUrl',
       new_window :{
         name: "nature's pocket",
         features: 'resizable=yes,height=613,width=400,left=400,top=300'
       },
       callback: function(){},
       session_data: {
         id: 342,
         data: 'user data'
       },
       stream: true,
       options: userOptions
      
    };
    
    test('set user params', function(t){ // user proveided params need to be in place
      t.plan(9);
      
      (function mockPeerDependency(){
         ro[ro.leg[0]] = {};
         ro[ro.leg[0]].oauth_callback = '';  // make property that is avalable upstream in perDependecy module
      })()
      ro.setUserParams(args);                // set parameters user provided
      
      t.equals(ro.server_url, args.server_url, 'server url');
      t.equals(ro.method, args.method, 'method');
      t.equals(ro[ro.leg[0]].oauth_callback, args.redirection_url, 'redirection url');
      t.deepEqual(ro.newWindow, args.new_window, 'new window');
      t.deepEqual(ro.callback_func, args.callback, 'callback function');
      t.deepEqual(ro.session_data, args.session_data, 'session data');
      t.equals(ro.options.queryParams.stream, args.stream, 'stream');          
      t.equals(ro.UserOptions.chunked, args.options.chunked, 'chunked stream'); 

      args.endpoints = {                     // add urls object to test changing of default twitter oauth endpoints
          request_token: 'request_token2',
          authorize:     'authenticate7',
          access_token:  'access_token24'
      }  
      
      var expected = {
       "access_token": "https://api.twitter.com/oauth/access_token24",
       "authorize": "https://api.twitter.com/oauth/authenticate7",
       "request_token": "https://api.twitter.com/oauth/request_token2",
      }
      
      ro.setUserParams(args);               // set with updated args

      t.deepEquals(ro.absoluteUrls, expected, 'can change all 3 endpoints');
      
       
    })    
   
   
    test('set user options (api options)', function(t){ // user options need to be in place
       t.plan(6);

       t.equals(ro.UserOptions.path, userOptions.path, 'path');
       t.equals(ro.UserOptions.method, userOptions.method, 'method');
       t.deepEquals(ro.UserOptions.params, userOptions.params, 'params');
       t.deepEquals(ro.UserOptions.body, userOptions.body,'body');
       t.equals(ro.UserOptions.encoding, userOptions.encoding,'encoding')
       t.deepEquals(ro.UserOptions.beforeSend, userOptions.beforeSend,'before send ')
       
      
    })

    test('request token leg (must have params)', function(t){ // params needed for request token leg
       t.plan(4);
       
       ro.server_url = ''; // no server url;
       t.throws(ro.checkUserParams.bind(ro, ro.leg[0]), {name:'serverUrlNotSet'}, 'server url missing, throw error ')
       ro.server_url = 'https://myserver.com';
       ro[ro.leg[0]].oauth_callback = ''; // no redirection_url

       t.throws(ro.checkUserParams.bind(ro, ro.leg[0]), {name: 'redirectionUrlNotSet'},'redirection url missing, throw error')
       
	
       ro[ro.leg[0]].oauth_callback = 'https://myapp.com/redirUrl'; 
       ro.UserOptions.path ='';  // no api path
      
       t.throws(ro.checkUserParams.bind(ro, ro.leg[0]), { name: 'optionNotSet'}, 'path missing, throw error')

       ro.UserOptions.path   = 'update/statuses.json'
       ro.UserOptions.method = '';  // no method
       
       t.throws(ro.checkUserParams.bind(ro, ro.leg[0]), { name: 'optionNotSet'}, 'method missing, throw error ')
    })    


    test('access token leg (must have params)', function(t){ // params needed for access token leg
       t.plan(3);

       ro.server_url = ''; // no server url;
       t.throws(ro.checkUserParams.bind(ro, ro.leg[2]), {name:'serverUrlNotSet'}, 'server url missing, throw error ')

       ro.server_url = 'https://myserver.com';
       ro.UserOptions.path = ''; // no api path
       ro.UserOptions.method = 'POST';

       t.throws(ro.checkUserParams.bind(ro, ro.leg[2]), { name: 'optionNotSet'}, 'path missing, throw error')
       
       ro.UserOptions.path   = 'update/statuses.json';
       ro.UserOptions.method = '' ;
       t.throws(ro.checkUserParams.bind(ro, ro.leg[2]), {name: 'optionNotSet'}, 'method missing, throw error')


    })
 
    test('set request options', function(t){ // checking that request options are in place
       t.plan(6) 
       var leg0 = ro.leg[0]        // testing for request token leg, same thing applies for access token leg
       ro.setRequestOptions(leg0);
       t.equals(ro.options.url, ro.server_url, 'url');
       t.equals(ro.options.method, args.method, 'method (from user)');
      
       args.method = '';                                   // simulate no method set by user
       ro.setUserParams(args);                             // set params again
       ro.setRequestOptions(leg0)                          // reset options

       t.equals(ro.options.method, ro.httpMethods[leg0], 'method (from leg settings)')  // then method is taken from this leg setting	
       t.deepEqual(ro.options.body, ro.UserOptions.body, 'body');
       t.equals(ro.options.encoding, ro.UserOptions.encoding, 'encoding');
       t.deepEquals(ro.options.beforeSend, ro.UserOptions.beforeSend, 'before send')	
        
    })	

   t.end() 
  })

 
  t.end()
})

