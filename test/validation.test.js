describe('Resource Actions', function(){
  describe('GET /todos', function(){
    it('should return the todos', function(done) {
      todos.post({title: 'foo todo'}, function (err) {
        todos.get(function (error, all) {
          expect(all).to.have.length(1);
          done(error || err);
        })
      })
    })

    it('should support the $orderby flag', function(done) {
      var query = {
        $orderby: {title: 1}
      };
      var queryJson = encodeURI(JSON.stringify(query));

      todos.post({title: 'c'}, function(e1) {
        todos.post({title: 'b'}, function(e2) {
          todos.post({title: 'a'}, function(e3) {
            todos.use('?q=' + queryJson).get(function(err, body, req, res) {
              expect(body).to.exist;
              expect(body.length).to.equal(3);
              expect(body[0].title).to.equal('a');
              expect(body[1].title).to.equal('b');
              expect(body[2].title).to.equal('c');
              done(e1, e2, e3, err);
            });
          });
        });
      });

    });
  })
  
  describe('POST /todos', function(){
    it('should return an error when provided invalid data', function(done) {
      todos.post({foo: 123, completed: 'flarg'}, function (err, todo, req, res) {
        expect(err).to.exist;
        expect(err.errors).to.be.a('object');
        expect(todo).to.not.exist;
        done();
      })
    })

    it('should post a date in a standard format', function(done) {
      todos.post({title: 'foo', dateCompleted: '12/12/12'}, function(err, todo, req, res) {
        expect(err).to.not.exist;
        expect(new Date(todo.dateCompleted) - new Date('12/12/12')).to.equal(0);
        done(err);
      });
    });

    it('should return an error for an invalid date', function(done) {
      todos.post({title: 'foo', dateCompleted: 'bad date'}, function(err, todo, req, res) {
        expect(err).to.exist;
        expect(err.errors.dateCompleted).to.exist;
        done();
      });
    });


    it('should accept null as a value for an optional property', function(done) {
      todos.post({title: 'foo', order: null}, function(err, todo, req, res) {
        expect(err).to.not.exist;
        expect(todo.order).to.not.be.ok
        done(err);
      });
    });

    it('should accept null as a value for an optional date property', function(done) {
      todos.post({title: 'foo', dateCompleted: ''}, function(err, todo, req, res) {
        expect(err).to.not.exist;
        expect(todo.dateCompleted).to.not.be.ok
        done(err);
      });
    });

    it('should parse strings for number properties', function(done) {
      todos.post({title: 'foo', order: '3'}, function(err, todo, req, res) {
        expect(err).to.not.exist;
        expect(todo.order).to.equal(3);
        done(err);
      });
    });

    it('should error for a non-numeric string on a number property', function(done) {
      todos.post({title: 'foo', order: 'foo'}, function(err, todo, req, res) {
        expect(err).to.exist;
        expect(err.errors.order).to.exist;
        done();
      });
    });

    it('should not allow an empty string for a non-optional property', function(done) {
      todos.post({title: ''}, function(err, todo, req, res) {
        expect(err).to.exist;
        expect(err.errors.title).to.exist;
        done();
      });
    });
    
    it('should ignore properties outside the schema', function(done) {
      todos.post({title: 'foo', bat: 'baz'}, function (err, todo, req, res) {
        todos.get(function (err, todos) {
          var todo = todos[0];
          expect(todo.title).to.equal('foo');
          expect(todo.bat).to.not.exist;
          done(err);
        })
      })
    })
    
    it('should save the todo when valid', function(done) {
      todos.post({title: 'feed the cat'}, function (err, todo) {
        expect(todo._id).to.exist;
        done(err);
      })
    })
  })
  
  describe('GET /todos/<ObjectID>', function(){
    it('should return a single item', function(done) {
      todos.post({title: 'a random todo'}, function (err, todo) {
        todos.use('/' + todo._id).get(function (e, t) {
          expect(t).to.exist;
          expect(t).to.be.a('object');
          expect(t._id).to.equal(todo._id);
          done(e);
        })
      })
    })
  })
  
  describe('PUT /todos/<ObjectID>', function(){
    it('should update a single item', function(done) {
      todos.post({title: 'a random todo', completed: true}, function (e, t) {
        t.title = 'foobar';
        todos.use('/' + t._id).put(t, function (error, todo) {
          todos.use('/' + todo._id).get(function (err, todo) {
            expect(todo).to.exist;
            expect(todo._id).to.exist;
            expect(todo.completed).to.equal(true);
            expect(todo.title).to.equal('foobar');
            done(err);
          })
        })
      })
    })
    
    it('should error when an id is not included', function(done) {
      unauthed.use('/todos').put({title: 'foo'}, function (err) {
        expect(err).to.exist;
        done();
      })
    })

    it('should only update and validate the properties provided', function(done) {
      todos.post({title: 'foo', order: 1}, function(ep, todo) {
        todos.use('/' + todo._id).put({completed: true}, function(epu, updatedTodo) {
          expect(epu).to.not.exist;

          expect(updatedTodo.title).to.equal('foo');
          expect(updatedTodo.order).to.equal(1);
          expect(updatedTodo.completed).to.equal(true);
          done(ep, epu);
        });  
      });
    });
  })
  
  describe('DELETE /todos/<ObjectID>', function(){
    it('should delete the todo', function(done) {
      todos.post({title: 'a random todo'}, function (e, t) {
        todos.use('/' + t._id).del(function (error) {
          todos.use('/' + t._id).get(function (err, todo) {
            expect(todo).to.not.exist;
            done(err);
          })
        })
      })
    })
    
    it('should error when an id is not included', function(done) {
      unauthed.use('/todos').del(function (err) {
        expect(err).to.exist;
        done();
      })
    })
  })
})