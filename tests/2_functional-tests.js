/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

var the_id, the_second_id, the_reply, the_other_reply;
var the_board = 'fcctest4';
var the_delete_password = '123';

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {

      test('Every field filled in', function(done) {
        chai.request(server)
         .post('/api/threads/' + the_board)
         .send({
          board: the_board,
          text: 'The test thread text',
          delete_password: the_delete_password,
         })
         .end(function(err, res){
           assert.equal(res.status, 200);
          });
        chai.request(server)
          .post('/api/threads/' + the_board)
          .send({
          board: the_board,
          text: 'The test thread text',
          delete_password: the_delete_password,
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Get an array of the most recent 10 bumped threads on the board',  function(done) {
        chai.request(server)
         .get('/api/threads/' + the_board)
         .end(function(err, res){
          //  console.log(res.body);
           assert.equal(res.status, 200);
           assert.isArray(res.body);
           assert.property(res.body[0], '_id');
           assert.property(res.body[0], 'text');
           assert.property(res.body[0], 'board');
           assert.property(res.body[0], 'replies');
           assert.property(res.body[0], 'bumped_on');
           assert.property(res.body[0], 'created_on');
           assert.isArray(res.body[0].replies);
           assert.equal(res.body[0].text, 'The test thread text');
           assert.equal(res.body[0].board, the_board);

           the_id = res.body[0]._id;
           the_second_id = res.body[1]._id;
           done(); 
          });
      });
    });
    
    suite('DELETE', function() {
      test('Thread deletion', function(done) {
        //console.log("iddd", the_id);
        chai.request(server)
        .delete('/api/threads/' + the_board)
        .send({
          thread_id : the_id,
          delete_password: the_delete_password
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
      });
      test('Thread deletion wrong password', function(done) {
        //console.log("iddd", the_id);
        chai.request(server)
        .delete('/api/threads/' + the_board)
        .send({
          thread_id : the_id,
          delete_password: 'worong pass xx'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
      });
    });
    
    suite('PUT', function() {
      test('Thread report', function(done) {
        chai.request(server)
        .put('/api/threads/' + the_board)
        .send({
          report_id : the_second_id,
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post a reply every field filled in', function(done) {
        chai.request(server)
         .post('/api/replies/' + the_board)
         .send({
          board: the_board,
          thread_id: the_second_id,
          text: 'The test REPLY text',
          delete_password: the_delete_password,
         })
         .end(function(err, res){
           assert.equal(res.status, 200);
          });
        chai.request(server)
        .post('/api/replies/' + the_board)
        .send({
          board: the_board,
          thread_id: the_second_id,
          text: 'The test REPLY text 2',
          delete_password: the_delete_password,
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          done();
          });
      });
    });
    
    suite('GET', function() {
      test('Get replies from a thread',  function(done) {
        console.log(the_second_id);
        chai.request(server)
         .get('/api/replies/' + the_board)
         .query({thread_id: the_second_id})
         .end(function(err, res){
          //  console.log(res.body);
           assert.equal(res.status, 200);
           assert.property(res.body, '_id');
           assert.property(res.body, 'text');
           assert.property(res.body, 'board');
           assert.property(res.body, 'replies');
           assert.property(res.body, 'bumped_on');
           assert.property(res.body, 'created_on');
           assert.isArray(res.body.replies);
           assert.equal(res.body.replies[0].text, 'The test REPLY text');

           the_reply = res.body.replies[0]._id;
           the_other_reply = res.body.replies[1]._id;
           done(); 
          });
      });
    });
    
    suite('PUT', function() {
      test('Reply report', function(done) {
        console.log('the reply', the_reply);
        chai.request(server)
        .put('/api/replies/' + the_board)
        .send({
          reply_id : the_reply,
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('Reply deletion', function(done) {
        //console.log("iddd", the_id);
        chai.request(server)
        .delete('/api/replies/' + the_board)
        .send({
          reply_id : the_reply,
          delete_password: the_delete_password
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
      });
      test('Reply deletion with incorrect password', function(done) {
        console.log("the_other_reply", the_other_reply);
        chai.request(server)
        .delete('/api/replies/' + the_board)
        .send({
          reply_id : the_other_reply,
          delete_password: 'a wrong pass xx'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
      });
    });
    
  });

});
