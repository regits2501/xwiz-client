var http = require('http');
var url  = require('url');
var path;
var headerName = 'Content-Type';
var data;

var mockRequestTokenData = JSON.stringify({             // mock successfull request token response
  oauth_token: 'longAlphaNum1',         // request token
  oauth_secret:'longAlphaNum2',  // secret
  oauth_callback_confirmed:'true'                       // twitter's confirmation of url user will be returned to
 
})

var twitterError = JSON.stringify({ error:[{"message":"Status is a duplicate", "code": 187}] })  // mock an error

var twitterApiData = JSON.stringify({             // mock a twitter api response
 "created_at":"Thu Apr 06 15:24:15 +0000 2017",
 "id": 850006245121695744,
 "id_str": "850006245121695744",
 "text": "1/ Today we’re sharing our vision for the future of the Twitter API platform!nhttps://t.co/XweGngmxlP",
 "user": {},  
 "entities": {}
});

var server = http.createServer(function(req,res){  // server mock

     url_        = url.parse(req.url, true); 
     path        = url_.pathname;
     path        = path.replace('/','');
     queryParams = url_.query;
      
     data = '';
     if(path !== 'CORS')            
        if(preflight(req, res)) return;
     
     req.on('data', function(d){ data = d.toString('utf8')});

     req.on('end', function(){
         if(path)
         switch(path){                                  // mirror back data from request (path convert to type)
            case  'request_token':                                
              send(res, mockRequestTokenData,"content-type", "application/json"); //  
            break;
            case  'request_token_error':              // path that trigger error response simulation           
              res.statusCode = '403'                  // consult twitte response code page for sementics of 403
              send(res, twitterError,"content-type", "application/json"); //  
            break;
            case  'request_token_api_data':              // path that trigger api data bringing       
              send(res, twitterApiData ,"content-type", "application/json"); //  
            break;
            case  'access_token':                    // there is no mockAccessTokenData since access_token is 
                                                     // never send to a browser
              send(res, twitterApiData ,"content-type", "application/json"); //  
            break;
            case  'access_token_error':              // path that trigger error response simulation           
              res.statusCode = '403'                  // consult twitte response code page for sementics of 403
              send(res, twitterError,"content-type", "application/json"); //  
            break;
            default:
              res.end('no content-type  specified');
       
       }
    
       
    })
})

function preflight(request, response){
     var preflight = false; 

     if (request.method == "OPTIONS"){  

        preflight = true;
        response.setHeader("Access-Control-Allow-Headers","content-type , authorization");
        response.setHeader("Access-Control-Allow-Origin", "*");

        response.end();
        return preflight;
      }
      else {
        response.setHeader("Access-Control-Allow-Origin","*"); // Other (no preflight) can have just 
      }

      var data = '';
      request.on('data', function(d){data += d});

      
      request.on('error', function(err){
        console.log("Error: "+ err);
      });
      return preflight;
}

function send(res, data , headerName, headerValue){
   res.setHeader(headerName, headerValue);
   res.end(data, 'utf-8')
}

server.listen(process.env.PORT || 5001);
