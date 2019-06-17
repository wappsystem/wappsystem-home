(function(){
    var modules={
        "home":                         {url:"$M/home.html",Table:"wappsystem-contact-us",router:1},
        "contact-us":    	            {url:"$M/modules/contact-us-data.html",Table:"wappsystem-contact-us"},
    }
    for(m in modules){$vm.module_list[m]=modules[m];}
})();
