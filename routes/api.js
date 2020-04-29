/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

let CONNECTION_STRING = process.env.CONNECTION_STRING;

/**
 * Get latest 3 replies from a thread
 */
const getReplies = (thread_id, limit = 3) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(CONNECTION_STRING, async function(err, client) {
      let db = client.db("MessageBoard");
      let replies_collection = db.collection('replies');
      replies_collection.find({thread_id: ObjectId(thread_id)}).sort({created_on: -1}).limit(limit).toArray((err, replies)=>{
        if(err){
          reject(err);
        } else {
          replies.forEach(reply => {
            delete reply.delete_password;
          });
          resolve(replies.reverse()) ;
        }
      })
    });
  });
};


module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get((req, res)=>{
    
    MongoClient.connect(CONNECTION_STRING, function(err, client) {
      let db = client.db("MessageBoard");
      var collection = db.collection('threads');
      collection.find({board: req.params.board}).sort({bumped_on: -1}).limit(10).toArray( async (err,threads)=>{
        //console.log(threads);
        const buildResponse = async ()=>{
          for (let i = 0; i < threads.length; i++) {
            const replies = await getReplies(threads[i]._id);
            threads[i].replies = replies;
            threads[i].replycount = replies.length;
            delete threads[i].delete_password;
            //console.log(replies);
          }
        }
        await buildResponse();
        res.json(threads);

      });
    });

  })


  .post((req, res )=>{
      // initial values
      let thread = {
        board: req.params.board,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false
      };
 
      if('text' in req.body) thread.text = req.body.text;
      if('delete_password' in req.body) thread.delete_password = req.body.delete_password;

      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        let db = client.db("MessageBoard");
        var collection = db.collection('threads');
        collection.insertOne(thread, (err,doc) =>{
          //console.log(doc);
          res.redirect('/b/' + req.params.board + '/');
        });
      });
    })
    
    .delete( (req, res)=>{
     
      // required fields
      if(!req.body.thread_id) {
        res.send("thread_id error");
      } 

      else {
        let query = {
          _id: ObjectId(req.body.thread_id),
          delete_password : req.body.delete_password
        }
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          let db = client.db('MessageBoard');
          let collection = db.collection('threads');
          collection.deleteOne(query, function (err,doc){
            if(err) {
              res.send('error on delete thread');
            } else
            if (doc.deletedCount === 1) {
              let replies_collection = db.collection('replies');
              replies_collection.deleteMany({thread_id: query._id}, function (err,deletedReplies){
                if(err) {
                  res.send('error on delete replies');
                } else {
                  //console.log(deletedReplies);
                  res.send("success");
                }
              });
            } else {
              res.send('incorrect password');
            }            
          });
        });
      }      
    })  
    
    .put( (req, res)=>{
      // required fields
      if(!req.body.report_id) { // fcc front end will send thread_id as report_id
        res.send("thread_id error");
      } 
      else {
        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          let db = client.db('MessageBoard');
          let collection = db.collection('threads');
          collection.findOneAndUpdate(
            {_id: ObjectId(req.body.report_id)},
            { $set: {reported: true } },
            { new: true, upsert: false },
            (err, reportedThread)=> {
              if(err){
                res.send('error on report reply');
              } else {
                if(reportedThread) {
                  res.send('success')
                } else {
                  res.send('thread does not exist')
                }
              }
            }
          );
        });
      } 
    });
  
  
  app.route('/api/replies/:board')
  
  .get((req, res)=>{
  
    MongoClient.connect(CONNECTION_STRING, function(err, client) {
      let db = client.db("MessageBoard");
      var collection = db.collection('threads');
      collection.findOne({_id: ObjectId(req.query.thread_id)}, async (err,thread)=>{
        //console.log(thread);
        if(thread){
          const buildResponse = async ()=>{
            const replies = await getReplies(thread._id, 10000);
            thread.replies = replies;
            thread.replycount = replies.length;
            delete thread.delete_password;
            //console.log(replies);
          }
          await buildResponse();
          //console.log(thread);
          res.json(thread);
        } else {
          res.send('thread does not exist');
        }

      });
    });

  })


  .post((req,res)=>{

    let thread = {};
    if('thread_id' in req.body ) {
      if(req.body.thread_id.length === 24) {
        thread._id = new ObjectId(req.body.thread_id);
      }
    } 
    else res.send("error in thread_id");

    // initial values
    let reply = {
      board: req.params.board,
      thread_id: thread._id,
      created_on: new Date(),
      reported: false
    };

    if('text' in req.body) reply.text = req.body.text;
    if('delete_password' in req.body) reply.delete_password = req.body.delete_password;

    MongoClient.connect(CONNECTION_STRING, function(err, client) {
      let db = client.db("MessageBoard");
      var collection = db.collection('replies');
      collection.insertOne(reply, (err,doc) =>{

        let threads_collection = db.collection('threads');
        threads_collection.findOneAndUpdate(
          thread,
          { $set: {bumped_on: reply.created_on } },
          { new: true, upsert: false },
          (err, doc)=> {
            if(err){
              res.send('error on update thread');
            } else {
              res.redirect('/b/' + req.params.board + '/' + req.body.thread_id + '/');
            }
          }
        );
      });
    });
  })

  .delete( (req, res)=>{
     
    // required fields
    if(!req.body.reply_id) {
      res.send("reply_id error");
    } 

    else {
      let reply = {
        _id: ObjectId(req.body.reply_id),
        delete_password : req.body.delete_password
      }
      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        let db = client.db('MessageBoard');
        let collection = db.collection('replies');
        collection.findOneAndUpdate(
          reply,
          { $set: {text: '[deleted]' } },
          { new: true, upsert: false },
          (err, deletedReply)=> {
            if(err){
              res.send('error on delete reply');
            } else {
              if(deletedReply.value !== null) {
                res.send('success');
              } else {
                res.send('incorrect password')
              }
            }
          }
        );
      });
    }      
  })
  
  .put( (req, res)=>{
    // required fields
    if(!req.body.reply_id) {
      res.send("put reply_id error");
    } 
    else {
      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        let db = client.db('MessageBoard');
        let collection = db.collection('replies');
        collection.findOneAndUpdate(
          {_id: ObjectId(req.body.reply_id)},
          { $set: {reported: true } },
          { new: true, upsert: false },
          (err, reportedReply)=> {
            if(err){
              res.send('error on delete reply');
            } else {
              if(reportedReply) {
                res.send('success')
              } else {
                res.send('reply does not exist')
              }
            }
          }
        );
      });
    } 

  });


};


