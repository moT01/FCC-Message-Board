const chaiHttp = require(`chai-http`);
const chai = require(`chai`);
const assert = chai.assert;
const server = require(`../server`);
let test_thread_id, test_reply_id;
const thread_id_from_db = '5baf91b81018130406236469';

chai.use(chaiHttp);

suite(`Functional Tests => all tests use the 'test' board\n`, function() {
  suite(`API ROUTING FOR /api/threads/:board\n`, function() {
    suite(`POST`, function() {
      test(`=> create a new thread on 'test' board`, function(done) {
        chai.request(server)
        .post('/api/threads/test')
        .send({ board: 'test', text: 'new thread text', delete_password: 'password' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          const split = res.redirects[0].split('/');
          const redirect = split[split.length-1];
          assert.equal(redirect, 'test');
          done();
        });
      });
    });

    suite(`GET`, function() {
      test('=> return recently bumped threads', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'board');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'replies');
          assert.property(res.body[0], 'replycount');
          test_thread_id = res.body[0]._id;
          done();
        });
      });
    });

    suite(`PUT`, function() {
      test('=> report a thread', function(done) {
        chai.request(server)
        .put('/api/threads/test')
        .send({ board:'test', thread_id: test_thread_id, })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'thread reported successfully');
          done();
        });
      });
    });

    suite(`DELETE`, function() {
      test('=> delete a thread', function(done) {
        chai.request(server)
        .delete('/api/threads/test')
        .send({ board: 'test', thread_id: test_thread_id, delete_password: 'password' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, `thread deleted successfully`);
          done();
        });
      });
    });
  });
  

  suite(`API ROUTING FOR /api/replies/:board\n`, function() {
    suite(`POST`, function() {
      test('=> create a new reply', function(done) {
        chai.request(server)
        .post('/api/replies/test')
        .send({ board: 'test', thread_id: thread_id_from_db, text: 'test reply', delete_password: 'password' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          const split = res.redirects[0].split('/');
          const boardURL = split[split.length-2];
          const threadURL = split[split.length-1];
          assert.equal(boardURL, 'test');
          assert.equal(threadURL, thread_id_from_db);
          done();
        });
      });
    });
    
    suite(`GET`, function() {
      test('=> return a thread with all the replies', function(done) {
        chai.request(server)
        .get('/api/replies/test')
        .send({ board: 'test', thread_id: thread_id_from_db })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body._id, thread_id_from_db);
          assert.equal(res.body.board, 'test');
          assert.equal(res.body.text, 'test thread');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'replies');
          test_reply_id = res.body.replies[0]._id;
          done();
        });
      });
    });
    
    suite(`PUT`, function() {
      test('=> report a reply', function(done) {
        chai.request(server)
        .put('/api/replies/test')
        .send({ board: 'test', thread_id: thread_id_from_db, reply_id: test_reply_id })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reply reported successfully');
          done();
        });
      });
    });
    
    suite(`DELETE`, function() {
      test('=> delete a reply', function(done) {
        chai.request(server)
        .delete('/api/replies/test')
        .send({ board: 'test', thread_id: thread_id_from_db, reply_id: test_reply_id, delete_password: 'password' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reply deleted successfully');
          done();
        });
      });
    });
  });
});
