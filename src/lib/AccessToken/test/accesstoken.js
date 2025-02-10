var AccessToken = require('../src/AccessToken_instrumented');
var assert      = require('assert');

function errorValidation(name, err){   // used to check thrown errors by name

    if(err.name === name) return true;
}

describe('Access Token', function(){
 
   var at = new AccessToken();                          // make instance
  
   var session_data = '?data=quote%3DIf%2520one%2520way%2520be%2520better%2520than%2520another%252C%2520that%2520you%2520may%2520be%2520sure%2520is%2520natures%2520way.%2520%26author%3DAristotle';
   var request_token = '&oauth_token=l4eELQAAAAAA0d0BAAABYxZJrAM';
   var verifier = '&oauth_verifier=oWP8wRebbcfArwyV0oh4YxAWMeHUFrRC'; 
   var query = session_data + request_token + verifier; // mock twitter redirection (callback) url with tokens
  
    describe('Success', function(){

                                          
 
      window.localStorage.requestToken_ = request_token.substring(13); // mock saved request token (in request 
                                                                       // token leg). Remove 'oauth_token='
      

      it('ready ', function(){
          at.winLoc += query;                              // mock curent location with tokens from twitter 
          assert.doesNotThrow(at.setAuthorizedTokens.bind(at));
      })

      it('oauth_verifier from url parsed', function(){     // check that oauth verifier is parsed 
         assert.ok(at.redirectionData.oauth_token);
      })
     
      it('oauth_token from url parsed', function(){        // check that oauth token is parsed 
         assert.ok(at.redirectionData.oauth_verifier);
      })
     
      it('load (saved) request token',function(){          // make sure that saved token is loaded
         assert.ok(at.loadedRequestToken);       
      })

      it('mark request token as used', function(){         // check that loaded token is marked as used
        var rToken = window.localStorage.requestToken_;
        var used = rToken === 'null' ? false : rToken

        assert.ok(!used);               
      })
      
     describe('session data', function(){                     // get session data
        it('get session data', function(){ 
            assert.ok(typeof at.getSessionData() === 'object'); 
         })
         
               
         it('redirection data', function(){               // check redirection data 
            var rdata = at.redirectionData.data;
            assert.ok(typeof rdata === 'string' && rdata.length != 0);
         })
        
         it('session data', function(){
            assert.ok(typeof at.sessionData === 'object')
         })
         
     }) 
   })

   describe('Failure', function(){
      var pageUrl = at.winLoc + query;                           // save current page 

      it('window location not found - throw error', function(){ 
         at.winLoc = '';                                         // current url not present 
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'urlNotFound'))
      })

      it('request token already used - throw error', function(){ // request token is allready used
         at.winLoc = pageUrl;
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation(null, 'noRepeat'));
      })

      it('oauth_token missing - throw error', function(){
         at.winLoc = session_data + verifier;                    // leave out oauth_token
         window.localStorage.requestToken_ = request_token;      // make token fresh 
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'tokenNotFound'))
      })
 
      it('oauth_verifier missing - throw error', function(){
         at.winLoc = session_data + request_token;               // leave out oauth_verifier
         window.localStorage.requestToken_ = request_token;      // make token fresh 
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'verifierNotFound'));
      })

      it('request token not saved - throw error', function(){
         at.winLoc = session_data + request_token + verifier;    // set current location (url)
         delete window.localStorage.requestToken_ ;              // make like token was not saved
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'requestTokenNotSaved'));
      })
    
      it('token missmatch - throw error', function(){                    // Check that received request_token 
                                                                         //  is same as  the one that is sent
         at.winLoc = pageUrl + session_data + request_token + verifier;  // Set current location (url)
         window.localStorage.requestToken_ = 'NotSameAsTheOneReceived';  // Make saved request_token different 
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'tokenMissmatch'));
      })

      it('request token not set', function(){                   // property is there but has no value
         at.winLoc = session_data + request_token + verifier;    // set current location (url)
         window.localStorage.requestToken_ = '';                 // make token fresh 
         assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'requestTokenNotSet'));
      })

      


      describe('session data', function(){

         it('session data not found - log warning on console', function(){                    
            at.winLoc = pageUrl + '?' + request_token.substring(1) + verifier;   // leave out session data
            window.localStorage.requestToken_ = request_token;                   // make token fresh 
            at.redirectionUrlParsed = false;                                     // parse again 
            assert.doesNotThrow(at.getSessionData.bind(at), undefined);
         })

      })
      
      describe('spa apps warning', function(){

           it('Authorization data not found in url - throw error', function(){
               at.winLoc = 'https://myApp.com/noQueryString'; // simulate no authorization data (request token 
                                                              // and verifier)
               assert.throws(at.setAuthorizedTokens.bind(at), errorValidation.bind(null, 'spaWarning'));
           })

      })
   })

  
}) 
