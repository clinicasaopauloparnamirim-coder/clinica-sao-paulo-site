(function(){
  var n=0, total=19;
  function next(){
    if(n>=total){
      var el=document.getElementById("hero-photo");
      if(el){
        var s="";
        for(var k=0;k<total;k++) s+=window["__H"+k]||"";
        el.src="data:image/jpeg;base64,"+s;
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
