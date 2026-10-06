(function(){
  var n=0, total=10;
  function next(){
    if(n>=total){
      var i=document.getElementById("hero-photo");
      if(i){
        var s="";
        for(var k=0;k<total;k++) s+=window["__H"+k]||"";
        i.src="data:image/jpeg;base64,"+s;
      }
      return;
    }
    var sc=document.createElement("script");
    sc.src="/hero-s"+n+".js";
    sc.onload=function(){n++;next();};
    sc.onerror=function(){n++;next();};
    document.head.appendChild(sc);
  }
  next();
})();
