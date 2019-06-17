//-------------------------------------
var m=$vm.module_list['__MODULE__'];
m.query={};
m.sort={_id:-1}
m.projection={}
//-------------------------------------
m.set_req=function(){
};
//-------------------------------------
m.set_req_export=function(i1,i2){
    var sql="with tb as (select Information,DateTime,Author,RowNum=row_number() over (order by ID DESC) from [TABLE-"+m.db_pid+"-@S1] )";
    sql+="select Information,DateTime,Author from tb where RowNum between @I1 and @I2";
	m.req={cmd:'read',qid:m.qid,sql:sql,i1:i1,i2:i2};
}
//-----------------------------------------------
m.request_data=function(){
    var limit=parseInt($('#page_size__ID').val());
    var skip=limit*parseInt($('#I__ID').text());
    var mt1=new Date().getTime();
    var c_cmd="count";
    if(m.cmd_type=='s') c_cmd='count-s';
    else if(m.cmd_type=='p1') c_cmd='count-p1';
    else if(m.cmd_type=='p2') c_cmd='count-p2';
    $vm.request({cmd:c_cmd,table:m.Table,query:m.query,search:$('#keyword__ID').val()},function(res){
        if(res.status=='np'){
            res.result=0;
        }
        var N=res.result;
        m.max_I=N/limit-1;
        $("#B__ID").text(N)
        var n2=skip+limit; if(n2>N) n2=N;
        var a=(skip+1).toString()+"~"+(n2).toString()+" of ";
        $("#A__ID").text(a);
    });
    var f_cmd="find";
    if(m.cmd_type=='s') f_cmd='find-s';
    else if(m.cmd_type=='p1') f_cmd='find-p1';
    else if(m.cmd_type=='p2') f_cmd='find-p2';
    $vm.request({cmd:f_cmd,table:m.Table,query:m.query,sort:m.sort,projection:m.projection,search:$('#keyword__ID').val(),skip:skip,limit:limit},function(res){
        var mt2=new Date().getTime();
        var tt_all=mt2-mt1;
        var tt_server=parseInt(res.sys.elapsed_time);
        if(tt_all<tt_server) tt_all=tt_server;
        var db="<span style='color:#0919ec'>&#9679;</span> "; if(res.sys.db==1 || res.sys.db=='on') db="<span style='color:#0bbe0b'>&#9679;</span> ";
        var tb="<span style='color:red'>&#9679;</span> ";     if(res.sys.tb==1 || res.sys.tb=='on') tb="<span style='color:#0bbe0b'>&#9679;</span> ";
        $("#elapsed__ID").html(db+tb+(JSON.stringify(res.result).length/1000).toFixed(1)+"kb/"+tt_all.toString()+"ms/"+tt_server+'ms');
        
        if(res.status=='np' || res.result==undefined){
            res.result=[];
        }

        if(res.status=='np'){
            if(res.sys.tb=='on') $vm.alert("No permission. Private database table, ask the table's owner for permissions.");
            else $vm.alert("No permission.");
        }

        m.records=res.result;
        m.res=res;
        if(m.data_process!==undefined){ m.data_process(); }
        m.render();
        if(m.data_process_after_render!==undefined){ m.data_process_after_render('grid'); }
    })
};
//-------------------------------------
m.render=function(){
    var start=0;
    var max=m.records.length;
    for(var i=start;i<max;i++){
        if(m.records[i].DateTime!==undefined){
            m.records[i].DateTime=m.records[i].DateTime.substring(0,10);
        }
        if(m.records[i].vm_dirty===undefined) m.records[i].vm_dirty=0;
        if(m.records[i].vm_custom===undefined) m.records[i].vm_custom={};
        if(m.records[i].vm_readonly===undefined) m.records[i].vm_readonly={};
    }

    var txt="";
    txt+="<tr><th></th>"
    //-------------------------
    m.create_header();
    //-------------------------
    for(var i=0;i<m.field_header.length;i++){
        var print='';
        var header_name=m.field_header[i];
        if(m.field_header[i][0]=='_'){
            print='class=c_print';
            header_name=header_name.replace('_','');
        }
        header_name=header_name.replace(/_/g,' ');
        var header_id=m.field_id[i];
        if(m.field_header[i]=='_Form')        txt+="<th "+print+" data-header="+header_id+"></th>";
        else if(m.field_header[i]=='_Delete') txt+="<th "+print+" data-header="+header_id+" style='width:30px;'></th>";
        else                                  txt+="<th "+print+" data-header="+header_id+">"+header_name+"</th>";
    }
    txt+"</tr>";
    for(var i=0;i<m.records.length;i++){
        txt+="<tr><td>"+(i+1).toString()+"</td>";
        for(var j=0;j<m.field_header.length;j++){
            var b=m.field_id[j];
            var value="";
            if(m.records[i][b]!==undefined){
                value=m.records[i][b];
                if(b=="Submit_date") value=$vm.date_to_ddmmyyyy(value.substring(0,10));
            }
            else{
                if(m.records[i]['Data']!=undefined && m.records[i]['Data'][b]!==undefined){
                    value=m.records[i]['Data'][b];
                }
            }
            if(value==undefined) value="";
            value=value.toString();
            value=$('<div/>').text(value).html();
            value=value.replace(/\n/g,'<br>');
            var print='';
            if(m.field_header[j][0]=='_') print='class=c_print';
            txt+="<td data-id="+b+" "+print+" >"+value+"</td>";
        }
        txt+="</tr>";
    }
    $('#grid__ID').html(txt);
    //------------------------------------
    m.cell_process();
}
//-------------------------------------
m.cell_process=function(){
    //cell render
    $('#grid__ID td').each(function(){
        var col = $(this).parent().children().index($(this));
        var row = $(this).parent().parent().children().index($(this).parent())-1; var I=row;
        var column_name=$('#grid__ID th:nth-child('+(col+1)+')').attr('data-header');
        //-------------------------
        if(column_name=='_Form'){
            var data_id=$(this).attr('data-id');
            $(this).css({'color':'#666','padding-left':'8px','padding-right':'8px'})
            $(this).html("<u style='cursor:pointer'><i class='fa fa-pencil-square-o'></i></u>");
            $(this).find('u').on('click',function(){
                m.form_I=row;
                if($vm.module_list[m.form_module]===undefined){
                    alert('Can not find "'+m.form_module+'" in the module list');
                    return;
                }
                $vm.load_module(m.form_module,$vm.root_layout_content_slot,{record:m.records[I]});
            })
        }
        //-------------------------
        if(column_name=='_Delete'){
            $(this).css({'color':'#666','padding-left':'8px','padding-right':'8px'})
            $(this).html("<u style='cursor:pointer'><i class='fa fa-trash-o'></i></u>");
            $(this).find('u').data('ID',m.records[row]._id);
            $(this).find('u').on('click',function(){
                var rid=$(this).data('ID');
                if(confirm("Are you sure to delete?\n")){
                    m.delete(rid);
                }
            })
        }
        //-------------------------
        if(m.cell_render!==undefined){ m.cell_render(m.records,row,column_name,$(this)); }
        //-------------------------
        if(column_name=='_Form' || column_name=='_Delete' || column_name=='DateTime' || column_name=='Author' || m.records[row].vm_readonly[column_name]===true){
            if($vm.edge==0) $(this).removeAttr('contenteditable');
            else if($vm.edge==1) $(this).find('div:first').removeAttr('contenteditable');
            $(this).css('background-color','#F8F8F8')
        }
        if(m.records[row].vm_custom[column_name]===true){
            if($vm.edge==0) $(this).removeAttr('contenteditable');
            else if($vm.edge==1) $(this).find('div:first').removeAttr('contenteditable');
        }
    })
    //------------------------------------
}
//-------------------------------------
m.create_header=function(){
    var cols=m.fields.split(',');
    m.field_header=[];
    m.field_id=[];
    //------------------------------------
    //table
    for(var i=0;i<cols.length;i++){
        var th=cols[i];
        var thA=th.split('|')[0];
        var thB=th.split('|').pop().trim().replace(/ /g,'_');
        //create grid header and id
        m.field_header.push(thA);
        m.field_id.push(thB);
    }
    //-------------------------
}
//-------------------------------------
m.delete=function(rid){
    $vm.request({cmd:"delete",id:rid,table:m.Table},function(res){
        //-----------------------------
        if(res.status=="lk"){
            $vm.alert("This record is locked.");
            return;
        }
        //-----------------------------
        if(res.status=="np"){
            alert("No permission to delete this record.");
            return;
        }
        //-----------------------------
        var after_delete=function(){
            if(m.after_delete!=undefined){
                m.after_delete(res); return;
            }
            m.request_data();
        }
        after_delete(res);
    });
};
//-------------------------------
m.export_records=function(){
    var req={cmd:"export",table:m.Table,search:$('#keyword__ID').val()}
    open_model__ID();
    $vm.request(req,function(N,i,txt){
        console.log(i+"/"+N);
        $('#msg__ID').text((100*i/N).toFixed(0)+"%");
        if(i==-1){
            var len=txt.length;
            var n_txt="["+txt.substring(5,len-9)+"]";
            var o=JSON.parse(n_txt);
            $vm.download_csv(m.Table+".csv",o);
            close_model__ID();
        }
    });
}
//---------------------------------------------
m.import_records=function(){
    $('#Import_f__ID').val('');
    $('#Import_f__ID').trigger('click');
}
//---------------------------------------------
m.handleFileSelect=function(evt){
    var form_fields=undefined;
    var before_submit=undefined;
    var start=function(){
        var files = evt.target.files;
        if(files.length==1){
            var reader = new FileReader();
            reader.onload = (function(e) {
                var contents = e.target.result;
                var lines=contents.replace(/\r/g,'\n').replace(/\n\n/g,'\n').split('\n');
                var NN=lines.length;
                if(lines[NN-1].length<2) NN--;
                NN--;
                if(lines.length>1){
                    var tab='\t';
                    var n1=lines[0].split('\t').length;
                    var n2=lines[0].split(',').length;
                    if(n2>n1) tab=',';
                    var header=lines[0].replace(/ /g,'_').splitCSV(tab);
                    var flds=fields.split(',');
                    var fn=$('#Import_f__ID').val().substring($('#Import_f__ID').val().lastIndexOf('\\')+1);
                    if(confirm("Are you sure to import "+fn+"?\n")){
                        open_model__ID();
                        var I=0;
                        var i=1;
                        var permission=1;
                        (function looper(){
                            if( i<=lines.length && i<=NN && permission==1) {
                                var items=lines[i].splitCSV(tab);
                                if(items.length>=1){
                                    var rd={};
                                    var dbv={};
                                    for(var j=0;j<flds.length;j++){
                                        var field_id=flds[j];
                                        var index=header.indexOf(field_id);
                                        var index2=form_fields.indexOf(field_id);
                                        if(index!=-1 && index2!=-1 && field_id.toUpperCase()!='ID')  rd[field_id]=items[index];
                                    }
                                    if( jQuery.isEmptyObject(rd)===false){
                                        if(typeof(before_submit)!='undefined'){
                                            before_submit(rd,dbv);
                                        }
                                        jQuery.ajaxSetup({async:false});
                                        $vm.request({cmd:"insert",table:m.Table,data:rd,index:dbv,file:{}},function(res){
                                            permission=res.status;
                                        });
                                        I++;
                                        jQuery.ajaxSetup({async:true});
                                    }
                                }
                                $('#msg__ID').text("Imported:"+ I.toString()+"/ processing line "+i+"/ total lines:"+NN);
                                i++;
                                setTimeout( looper, 100);
                            }
                            else{
                                close_model__ID();
                                alert(I.toString()+" records have been imported.");
                                m.request_data();
                            }
                        })();
                    }
                }
            });
            reader.readAsText(files[0]);
        }
    }

    if($vm.module_list[m.form_module].id==undefined){
        $vm.load_module(m.form_module,"hidden",{})
    }
    var I=0;
    var loop__ID=setInterval(function (){
        if($vm.module_list[m.form_module].submit!=undefined){
            clearInterval(loop__ID);
            var x=document.getElementById("F"+$vm.module_list[m.form_module].id);
            var txt="";var nm0="";
            for (var i=0; i < x.length; i++) {
                var nm=x.elements[i].getAttribute("name");
                if(nm!=null && nm!=nm0){ if(txt!="") txt+=", "; txt+=nm; nm0=nm;}
            }
            form_fields=txt;
            before_submit=$vm.module_list[m.form_module].before_submit;
            start();
        }
        I++; if(I>50){
            clearInterval(loop__ID); alert("Teh "+m.form_module+" is not installed.");
        }
    },100);
    //-------------------------------------
}
//-----------------------------------------------
document.getElementById('Import_f__ID').addEventListener('change', m.handleFileSelect,false);
//---------------------------------------------
$('#search__ID').on('click',function(){   m.set_req(); m.request_data(); })
$('#query__ID').on('click',function(){    m.set_req(); m.request_data(); })
$('#export__ID').on('click',function(){   m.export_records(); })
$('#import__ID').on('click',function(){   m.import_records(); })
$("#p__ID").on('click',function(){  var I=$("#I__ID").text();I--; if(I<0) I=0; $("#I__ID").text(I); m.set_req(); m.request_data();})
$("#n__ID").on('click',function(){  var I=$("#I__ID").text();I++; if(I>m.max_I) I=m.max_I; $("#I__ID").text(I); m.set_req(); m.request_data();})
//-------------------------------------
$('#new__ID').on('click', function(){
    if(m.new!=undefined){
        m.new();
        return;
    }
    if(m.form_module!=undefined){
        $vm.load_module(m.form_module,'',{goback:1});
        return;
    }
    if(m.new_process!=undefined){
        if(m.new_process()==false) return;
    }
    var new_records;
    var new_row={}
    for(var i=0;i<m.field_id.length;i++){
        var b=m.field_id[i];
        if(b!=="ID" && b!=="DateTime" && b!=="Author" && b!=="_Form" && b!=="_Delete"){
            new_row[b]="";
        }
    }
    m.records.splice(0, 0, new_row);
    if(m.new_pre_data_process!==undefined){
        m.new_pre_data_process();
    }
    m.render(0);
});
$('#D__ID').on('load',function(){  m.input=$vm.vm['__ID'].input; if(m.preload==true) return; if(m.load!=undefined) m.load(); m.set_req(); m.request_data(); })
$('#D__ID').on('show',function(){  if($vm.refresh==1){$vm.refresh=0; m.set_req(); m.request_data();} })
//-----------------------------------------------
m.set_file_link=function(records,I,field,td){
    var filename=records[I].Data[field];
    td.html("<u style='cursor:pointer'>"+filename+"</u>");
    td.find('u').on('click',function(){
        var url=m.Table+"/"+records[I].UID+"-"+field+"-"+filename;
        $vm.open_s3_url(records[I]._id,m.Table,filename,url);
    })
}
//-------------------------------
