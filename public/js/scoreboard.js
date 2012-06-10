$(document).bind("mobileinit", function(){

  var scoreboard = new Scoreboard();
  setInterval(function() { $("#timer").html(scoreboard.timer.remaining_minutes());
                          if (scoreboard.timer.is_finished()) {
                             $("#start span").text("Reiniciar");
                           }
                         },500)

  $("#white-advantage").live("click", function(){ scoreboard.white.add_advantage();  });
  $("#white-penalty").live("click", function(){ scoreboard.white.add_penalty(); });
  $("#white-two-points").live("click", function(){ scoreboard.white.add_two_points(); });
  $("#white-three-points").live("click", function(){ scoreboard.white.add_three_points(); });
  $("#white-four-points").live("click", function(){ scoreboard.white.add_four_points(); });
  $("#white-undo-last").live("click", function(){ scoreboard.white.undo_last(); });

  $("#blue-advantage").live("click", function(){ scoreboard.blue.add_advantage(); });
  $("#blue-penalty").live("click", function(){ scoreboard.blue.add_penalty(); });
  $("#blue-two-points").live("click", function(){ scoreboard.blue.add_two_points(); });
  $("#blue-three-points").live("click", function(){ scoreboard.blue.add_three_points(); });
  $("#blue-four-points").live("click", function(){ scoreboard.blue.add_four_points(); });
  $("#blue-undo-last").live("click", function(){ scoreboard.blue.undo_last(); });

    var refreshScoreboard = function() {

    //white side control
    $('#result-white-advantage').val(scoreboard.white.advantages);
    $('#result-white-penalty').val(scoreboard.white.penalties);
    $('#result-white-two-points').val(scoreboard.white.sum_of_two_points());
    $('#result-white-three-points').val(scoreboard.white.sum_of_three_points());
    $('#result-white-four-points').val(scoreboard.white.sum_of_four_points());
    $('#result-white-total-points').val(scoreboard.white.total_points());

    //blue side control
    $('#result-blue-advantage').val(scoreboard.blue.advantages);
    $('#result-blue-penalty').val(scoreboard.blue.penalties);
    $('#result-blue-two-points').val(scoreboard.blue.sum_of_two_points());
    $('#result-blue-three-points').val(scoreboard.blue.sum_of_three_points());
    $('#result-blue-four-points').val(scoreboard.blue.sum_of_four_points());
    $('#result-blue-total-points').val(scoreboard.blue.total_points());
       
  };

  $('a[href]').live('click', function(){ refreshScoreboard() });

  $("#start").live("click", function(){
	if (scoreboard.timer.is_waiting())  {scoreboard.start(); $("#start span").text("Parar"); return;}
    if (scoreboard.timer.is_finished())  {scoreboard.restart(); $("#start span").text("Parar"); return;}
    if (scoreboard.timer.is_started())  {scoreboard.pause(); $("#start span").text("Continuar"); return;}
    if (scoreboard.timer.is_paused())  {scoreboard.continuate(); $("#start span").text("Parar"); return;}
  });

  $("#reset").live("click", function(){
    if(confirm("Deseja realmente encerrar a luta?")){
      scoreboard.finish();
    }
  });

});

var Scoreboard = function(options){
  options = options || {};
  this.timer = options.timer || new Timer();
  this.white = options.white || new Side();
  this.blue = options.blue || new Side();

  this.start = function() {
    this.timer.start();
  }

  this.pause = function() {
    this.timer.pause();
  }

  this.continuate = function() {
    this.timer.continuate();
  }

  this.finish = function() {
    this.timer.finish();
  }

  this.restart = function() {
    this.white.reset();
    this.blue.reset();
    this.timer.restart();
  }

};

var Side = function(){

  this.advantages = 0;
  this.penalties = 0;
  this.points = [];
  this.commandListener = new CommandListener();

  this.add_two_points = function(){
    this.compute({command: 'addPoints', value: 2});
  }

  this.add_three_points = function(){
    this.compute({command: 'addPoints', value: 3});
  }

  this.add_four_points = function(){
    this.compute({command: 'addPoints', value: 4});
  }

 this.add_advantage = function() {
    this.compute({command: 'addAdvantage', value: 1});
  }

  this.add_penalty = function() {
    this.compute({command: 'addPenalty', value: 1});
  }

  this.sum_of_two_points = function(){
    return this.sum_of(2);
  }

  this.sum_of_three_points = function(){
    return this.sum_of(3);
  }

  this.sum_of_four_points = function(){
    return this.sum_of(4);
  }

  this.total_points = function(){
    return this.sum_of(2) + this.sum_of(3) + this.sum_of(4);
  }

  this.compute = function(args) {
    this.commandListener.handle(args);
    ScoreManager[args.command](this, args.value);
  }

  this.sum_of = function(points){
    var sum = 0;
    for(i=0; i<this.points.length; i++){
      if(this.points[i] == points){
        sum += points;
      }
    }
    return sum;
  }

  this.undo_last = function(){
    var cmd = this.commandListener.undoCommand();
    ScoreManager[cmd.command](this, cmd.value);
  }

  this.reset = function(){
    this.advantages = 0;
    this.penalties = 0;
    this.points = [];
    this.commandListener = new CommandListener();
  }

};

var CommandListener = function(){
  this.stack = [];
  this.handle = function(args){
    this.stack.push(args);
  }

  this.undoCommand = function(){
     return this.inverseWay();
  }

  this.lastCommand = function(){
    if (!this.stack.length) return;
    var last = this.stack[this.stack.length-1];
    this.stack.pop();
    return last;
  }

  this.inverseWay = function(){

    var cmd = this.lastCommand();
    switch(cmd.command){
      case "addPoints":
        return { command: "removePoints", value: cmd.value };
       case "addAdvantage":
        return { command: "removeAdvantage", value: cmd.value };
       case "addPenalty":
        return { command: "removePenalty", value: cmd.value };
      default:
        throw "Unknown command";
    }
  }
};

var ScoreManager = {

   MIN_POINTS: 2,
   MAX_POINTS: 4,
   addPoints: function(side, value){
    if (value < this.MIN_POINTS && value > this.MAX_POINTS)
      throw "The value should be between " + this.MIN_POINTS + " and " + this.MAX_POINTS;

    side.points.push(value);
  },
  removePoints: function(side, value){
    for (i = side.points.length-1; i>=0; i--){
      if(side.points[i] == value){
        delete side.points[i];
        break;
      }
    }
  },
  addAdvantage: function(side, value){
    side.advantages += value;
  },
  removeAdvantage: function(side, value){
    side.advantages -= value;
  },
  addPenalty: function(side, value){
    side.penalties += value;
  },
  removePenalty: function(side, value){
    side.penalties -= value;
  }

};

var TimerState = {
  WAITING : 0,
  STARTED : 1,
  PAUSED  : 2,
  FINISHED: 3
};

var Timer = function(options){
  options = options || {};
  this.start_seconds = options.start_minutes || (5*60);
  this.remain_seconds = this.start_seconds;
  this.state = options.state || TimerState.WAITING;

  this.start = function(){
    this.state = TimerState.STARTED;
    this.countdown();
  }

  this.pause = function(){
    this.state = TimerState.PAUSED;
  }

  this.continuate = function(){
    this.state = TimerState.STARTED;
    this.countdown();
  }

  this.finish = function(){
    this.state = TimerState.FINISHED;
  }

  this.restart = function(){
    this.remain_seconds = this.start_seconds;
    this.start();
  }

  this.is_waiting = function() {
    return this.state == TimerState.WAITING;
  }

  this.is_started = function() {
    return this.state == TimerState.STARTED;
  }

  this.is_paused = function() {
    return this.state == TimerState.PAUSED;
  }

  this.is_finished = function() {
    return this.state == TimerState.FINISHED;
  }

  this.remaining_minutes = function(){
    return Math.floor(this.remain_seconds/60) + ":" + (this.remain_seconds%60 < 10 ? "0": "") + this.remain_seconds%60;
  }

  this.countdown = function(){
    _this = this;
    var interval = setInterval(function(){
      console.log(_this.remain_seconds);

      if(_this.is_started()) {
        _this.remain_seconds--;
      }
      if(_this.is_waiting() || _this.is_paused() || _this.is_finished()) {
        clearInterval(interval);
        return;
      }
      if(_this.remain_seconds == 0) { _this.state = TimerState.FINISHED; }
    },1000);
  }
};
