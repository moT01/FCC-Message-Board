`use strict`;

const expect = require(`chai`).expect;
const Thread = require(`./threadModel`);
const ObjectId = require(`mongodb`).ObjectID;

module.exports = function (app) {
  app.route(`/api/threads/:board`)
  .get((req, res) => {
    /*GET an array of the most recent 10 bumped threads on the board with only the most recent 3 replies 
    from /api/threads/{board}. The reported and delete_passwords fields will not be sent.*/
    console.log(`.get/threads`);
    const board = req.params.board;

    Thread.find({ board: board }, (err, threads) => {
      if(err) { return res.send(`could not get threads`); }

      //sort by most recent bumps
      let tempThreads = threads.sort((a, b) => {
        return b.bumped_on > a.bumped_on;
      });

      //get the 10 most recent
      if(tempThreads.length > 10) {
        tempThreads = tempThreads.filter((thread, index) => {
          return index < 10;
        });
      }

      let returnThreads = [];

      tempThreads.forEach(thread => {
        let tempReturnThread = {
          _id: thread._id,
          board: thread.board,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,        
          replies: [],
          replycount: thread.replies.length
        };

        thread.replies.forEach((reply, index) => {
          tempReply = {
            _id: reply.id,
            text: reply.text,
            created_on: reply.created_on
          }

          if(index < 3) {
            tempReturnThread.replies.push(tempReply);
          }
        });
        returnThreads.push(tempReturnThread);
      });
      return res.json(returnThreads);
    });
  })

  .post((req, res) => {
    /*POST thread to board by passing form data text and delete_password to /api/threads/{board}
    (Recomend res.redirect to board page /b/{board}). Saved will be _id, text, created_on(date&time),
    bumped_on(date&time, starts same as created_on), reported(boolean), delete_password, & replies(array).*/
    console.log(`.post/threads`);
    const { text, delete_password } = req.body;
    const board = req.body.board || req.params.board;

    if(!board || !text || !delete_password) { return res.send(`incomplete form`); }

    new Thread({
      board: board,
      text: text,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      delete_password: delete_password,
      replies: []
    }).save((err, thread) => {
      if (err) { return res.send(`could not save thread`); }
      res.redirect(`/b/${board}`)
    });
  })

  .put((req, res) => {
    /*report a thread and change it's reported value to true by sending a PUT request to
    /api/threads/{board} and pass along the thread_id. (Text response will be 'success')*/
    console.log(`.put/threads`);
    const { thread_id } = req.body;
    const board = req.body.board || req.params.board;

    Thread.findById(thread_id, (err, thread) => {
      if(err)                   { return res.send(`could not find thread id`); }
      if(thread.board != board) { return res.send(`invalid board name`);       }

      thread.reported = true;
      thread.save(err => {
        if(err) { return res.send(`could not save thread`); }
        return res.send(`thread reported successfully`);
      });
    });
  })

  .delete((req, res) => {
    /*delete a thread completely if I send a DELETE request to /api/threads/{board} 
    and pass along the thread_id & delete_password. (Text response will be 'incorrect password' or 'success')*/
    console.log(`.delete/threads`);
    const { thread_id, delete_password } = req.body;
    const board = req.body.board || req.params.board;

    Thread.findById(thread_id, (err, thread) => {
      if(err)                                        { return res.send(`could not find thread id`); }
      if(thread.board != board)                      { return res.send(`invalid board name`);       }
      if(delete_password !== thread.delete_password) { return res.send(`incorrect password`);       }

      Thread.deleteOne({_id: thread_id}, err => {
        if(err) { return res.send(`could not delete thread`); }
        return res.send(`thread deleted successfully`);
      });
    });
  })



  app.route(`/api/replies/:board`)
  .get((req, res) => {
    /*GET an entire thread with all its replies from /api/replies/{board}?thread_id={thread_id}.
    hiding the reported and delete_password fields.*/
    console.log(`.get/replies`);
    const board = req.params.board;
    const thread_id = req.query.thread_id || req.body.thread_id;

    Thread.findById(thread_id, (err, thread) => {
      if(err)                    { return res.send(`could not find thread id`) }
      if(thread.board !== board) { return res.send(`invalid board name`);      }

      const tempReplies = [];
      
      thread.replies.forEach((reply, index) => {
        const tempReply = {
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }

        tempReplies.push(tempReply);

        if(index === thread.replies.length-1) {
          const tempThread = {
            _id: thread._id,
            board: thread.board,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: tempReplies
          }

        return res.json(tempThread);
        }
      });
    });
  })

  .post((req, res) => {
    /*POST reply to a thread on a specific board by passing form data text, delete_password, 
    & thread_id to /api/replies/{board} and it will also update the bumped_on date 
    to the comments date.(Recomend res.redirect to thread page /b/{board}/{thread_id}) 
    In the thread's 'replies' array will be saved _id, text, created_on, delete_password, & reported.*/
    console.log(`.post/replies`);
    const { thread_id, text, delete_password } = req.body;
    const board = req.body.board || req.params.board;

    Thread.findById(thread_id, (err, thread) => {
      if(err)                   { return res.send(`could not find thread id`); }
      if(thread.board != board) { return res.send(`invalid board name`);       }

      const reply = {
        _id: new ObjectId(),
        text: text,
        delete_password: delete_password,
        reported: false,
        created_on: new Date()
      }

      thread.replies.unshift(reply);
      thread.bumped_on = new Date();
      thread.save(err => {
        if(err) { return res.send(`could not save reply`); }
        return res.redirect(`/b/${board}/${thread_id}`);
      });
    });
  })

  .put((req, res) => {
    /*report a reply and change it's reported value to true by sending a PUT request 
    to /api/replies/{board} and pass along the thread_id & reply_id. (Text response will be 'success')*/
    console.log(`.put/replies`);
    const { thread_id, reply_id } = req.body;
    const board = req.body.board || req.params.board;

    Thread.findById(thread_id, (err, thread) => {
      const index = thread.replies.findIndex(reply => {
        return reply._id == reply_id
      });

      if(err)                   { return res.send(`could not find thread id`); }
      if(thread.board != board) { return res.send(`invalid board name`);       }
      if(index < 0)             { return res.send(`could not find reply id`);  }

      const newReply = {
        _id: thread.replies[index]._id,
        text: thread.replies[index].text,
        delete_password: thread.replies[index].delete_password,
        reported: true,
        created_on: thread.replies[index].created_on
      }

      thread.replies.splice(index, 1, newReply);
      thread.save(err => {
        if(err) { return res.send(`could not save thread`); }
        return res.send(`reply reported successfully`);
      });
    });
  })

  .delete((req, res) => {
    /*delete a post(just changing the text to '[deleted]') if I send a DELETE request
    to /api/replies/{board} and pass along the thread_id, reply_id, & delete_password.
    (Text response will be 'incorrect password' or 'success')*/
    console.log(`.delete/replies`);
    const { thread_id, reply_id, delete_password } = req.body;
    const board = req.body.board || req.params.board;

    Thread.findById(thread_id, (err, thread) => {
      const index = thread.replies.findIndex(reply => reply.id == reply_id);
      if(err)                                                       { return res.send(`could not find thread id`); }
      if(thread.board != board)                                     { return res.send(`invalid board name`);       }
      if(index < 0)                                                 { return res.send(`could not find reply id`);  }
      if(delete_password !== thread.replies[index].delete_password) { return res.send(`incorrect password`);       }

      thread.replies[index].text = `[DELETED]`;
      thread.save(err => {
        if(err) { return res.send(`could not delete reply`); }
        return res.send(`reply deleted successfully`);
      });
    });
  });
};
