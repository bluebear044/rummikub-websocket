var test = require('unit.js');
var fs = require('fs');
eval(fs.readFileSync('./constant.js')+'');
eval(fs.readFileSync('./rummikub.js')+'');

describe('Rummikub Test', function(){
    
  it('example', function(){
    // just for example of tested value
    var example = 'hello example  value';
    test
      .string(example)
        .startsWith('hello')
        .match(/[a-z]/)
      .given(example = 'you are welcome')
        .string(example)
          .endsWith('welcome')
          .contains('you')
      .when('"example" becomes an object', function(){
            example = {
          message: 'hello world',
          name: 'Nico',
          job: 'developper',
          from: 'France'
        };
      })
      .then('test the "example" object', function(){
        test
          .object(example)
            .hasValue('developper')
            .hasProperty('name')
            .hasProperty('from', 'France')
            .contains({message: 'hello world'})
        ;
      })
      .if(example = 'bad value')
        .error(function(){
          example.badMethod();
        })
    ;
  });
  
  it('Case [Same Color, Running Numbers]', function(){

    var rummikub = new Rummikub();

      var param = [];
      param.push(new Tile("1", "red", false));
      param.push(new Tile("2", "red", false));
      param.push(new Tile("3", "red", false));

      var result = rummikub.validateTile(param);
      test.assert.equal(result, true);

  });  

  it('Case [Same Color, Running Numbers, Wrong case]', function(){

    var rummikub = new Rummikub();

      var param = [];
      param.push(new Tile("1", "red", false));
      param.push(new Tile("2", "red", false));
      param.push(new Tile("4", "red", false));

      var result = rummikub.validateTile(param);
      test.assert.equal(result, false);

  });

  it('Case [Same Color, Running Numbers, with Joker]', function(){

    var rummikub = new Rummikub();

      var param = [];
      param.push(new Tile("1", "red", false));
      param.push(new Tile("30", "red", true));
      param.push(new Tile("30", "red", true));

      var result = rummikub.validateTile(param);

      console.log(result);

      test.assert.equal(result, true);

  });

  it('Case [Diffrent Colors, Same Number]', function(){

    var rummikub = new Rummikub();

      var param = [];
      param.push(new Tile("13", "blue", false));
      param.push(new Tile("13", "yellow", false));
      param.push(new Tile("13", "red", false));
      param.push(new Tile("13", "bkack", false));

      var result = rummikub.validateTile(param);
      test.assert.equal(result, true);

  });  

  it('Case [Diffrent Colors, Same Number, Wrong case]', function(){

    var rummikub = new Rummikub();

      var param = [];
      param.push(new Tile("13", "blue", false));
      param.push(new Tile("13", "yellow", false));
      param.push(new Tile("13", "red", false));
      param.push(new Tile("13", "red", false));

      var result = rummikub.validateTile(param);
      test.assert.equal(result, false);

  });  

  it('Case [Diffrent Colors, Same Number, with Joker]', function(){

    var rummikub = new Rummikub();

      var param = [];
      param.push(new Tile("13", "blue", false));
      param.push(new Tile("13", "yellow", false));
      param.push(new Tile("13", "red", true));

      var result = rummikub.validateTile(param);
      test.assert.equal(result, true);

  });

});