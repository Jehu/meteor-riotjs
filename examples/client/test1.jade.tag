test1
  style(type='stylus').
    #mytag1
     color: blue;
  span#mytag1 Test1
  script(type='coffee').
    square = (x) => x*x
    console.log "run from coffee"
    console.log square(2)
  script.
    console.log("run from normal1")