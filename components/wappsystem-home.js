(function(){
    var modules={
        "home":                         {url:"$M/home.html",Table:"wappsystem-contact-us",router:1},
        "contact-us":    	            {url:"$M/modules/contact-us-data.html",Table:"wappsystem-contact-us"},
    }
    for(m in modules){$vm.module_list[m]=modules[m];}
    for(p in $vm.module_list) $vm.module_list[p].url=$vm.module_list[p].url.replace('$M',$vm.m_path);
})();
