var RequestToken = require('../src/RequestToken_instrumented');
var assert       = require('assert');

var rt = new RequestToken();

describe('request token', function(t){
   
  it('request token name', function(){
   assert.equal(rt.name , rt.leg[0]);
  })

}) 
