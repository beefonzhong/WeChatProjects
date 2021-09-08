// index.js
// 获取应用实例
const app = getApp()
const recorderManager=wx.getRecorderManager()

Page({
   /**
    * 页面的初始数据
    */
   data: {
     textMessage: '',
     chatItems: [],
     type:'',
     height:100,
     isShow:false,
     luYing:false,
     toView: 'listBottom',
   },
  
   /**
    * 生命周期函数--监听页面加载
    */
   onLoad(options) {
     this.getPage(options);
     var chatItem ={
         language:'zh_cn',
         language2:'en_us',
         editing:false,
         playing:false,
         focus:false,
         message:'你好，你好！',
         tmessage:'Hello,Hello!'
      }
      this.data.chatItems.push(chatItem)
      this.setData({
         chatItems: this.data.chatItems
      });
     this.setData({ 
         scrollHeight: wx.getSystemInfoSync().windowHeight-60,
         
      })
   },
   setMessage(e){
     let {value} = e.detail;
     this.setData({
       textMessage:value
     })
   },

   editMessage(e){
      let idx=e.currentTarget.dataset.idx; 
      console.log(idx)
      console.log(this.data.chatItems[idx])
      if (this.data.chatItems[idx].editing) {
         this.data.chatItems[idx].editing=false;
         this.data.chatItems[idx].focus=false;
         //调翻译
         this.data.chatItems[idx].tmessage=this.translate( this.data.chatItems[idx].language,this.data.chatItems[idx].language2,this.data.chatItems[idx].message,idx);
         console.log(this.data.chatItems[idx].tmessage)
      }else{
         this.data.chatItems[idx].editing=true;
         this.data.chatItems[idx].focus=true;
      }
      this.setData({
         chatItems: this.data.chatItems
      });
   },


   //调翻译接口
   translate(from,to,msg,idx){ 
      let that = this;
      wx.request({
         url: 'https://www.youhuigou.ink/fanyi/fanyi', //仅为示例，并非真实的接口地址
         data: {
            from: from,
            to: to,
            message:msg
         },
         header: {
           'content-type': 'application/json' // 默认值
         },
         success (res) {
            console.log(res.data) 
           //let resdata= JSON.parse(res.data); 
            that.data.chatItems[idx].tmessage=res.data.message;
            that.setData({
               chatItems: that.data.chatItems
            });
         }
       })
   },

   bzInput(e){
      let idx=e.currentTarget.dataset.idx; 
      this.data.chatItems[idx].message=e.detail.value;
      this.setData({
         chatItems: this.data.chatItems
      });
   },

   getPage(options){
   //   let {type,top} = options;
   //   this.setData({
   //     type: type,
   //     top:top
   //   })
   //   //获取对方和我方信息
 
   },
   addmessagelist(language,language2, message,tmessage){
      var chatItem ={
         language:language,
         language2:language2,
         editing:false,
         playing:false,
         focus:false,
         message:message,
         tmessage:tmessage
      }
      this.data.chatItems.push(chatItem)
      this.setData({
         chatItems: this.data.chatItems
      });
      this.goToBottom();
      //发到后端
   },
   
   showLy(e){
     let { luYing } = this.data;
     if (luYing) {
       luYing = false;
     } else {
       luYing = true;
     }
     this.setData({
       luYing: luYing
     });
   },
   //开始录音
   startLuyin(){
     //录音及检测
      wx.showLoading({
        title: '录音中...',
      });
     console.log("开始录音...")
     const options={
        duration:60000,
        sampleRate:16000,//采样率
        numberOfChannels:1,
        encodeBitRate:96000,
        format:'mp3',
        frameSize:50
     };
     recorderManager.start(options);
 
   },
   //结束录音并上传
   endLuyin(e) {
      wx.hideLoading();
      let language= e.currentTarget.dataset.language; // zh_cn：中文（支持简单的英文识别）  en_us：英文
      let language2="";
      if (language=="zh_cn"){
         language2="en_us"
      }else{
         language2="zh_cn"
      }
      let that=this;
      //上传完毕后返回路径并发送消息
      console.log("结束录音...")
      recorderManager.stop(); //先停止录音
      recorderManager.onStop((res) => {  //监听录音停止的事件
         console.log("监听录音停止事件",res)
         if (res.duration < 500) {
           wx.showToast({
             title: '录音时间太短'
           })
           return;
         } else {
           wx.showLoading({
             title: '发送中...',
           });
    
           var tempFilePath = res.tempFilePath; // 文件临时路径
           console.log("文件临时路径", tempFilePath)
    
           wx.uploadFile({
             url: 'https://www.youhuigou.ink/fanyi/yuyin', //上传服务器的地址
             filePath: tempFilePath, //临时路径
             name: 'fileUpload',
             header: {
               contentType: "multipart/form-data", //按需求增加
             },
             formData: {
               language:language,// zh_cn：中文（支持简单的英文识别）  en_us：英文
             },
             success: function (res) { 
               console.log(res)
               let resdata= JSON.parse(res.data);
               let tmessage="";
               if (resdata.message.length>0){
                  tmessage= that.translate(language,language2,resdata.message,that.data.chatItems.length)
               }
               that.addmessagelist(language,language2, resdata.message,tmessage)
               wx.hideLoading();
               
             },
             fail: function (err) {
               wx.hideLoading();
               console.log(err.errMsg);//上传失败
             }
           });
         }
       });
 
   },

   // 容器滚动到底部
   goToBottom() {
      this.setData({ 
         scrollTop: this.data.chatItems.length * 500
      })
   },

   playing(e){
      // let that = this;
      // let dataset = e.currentTarget.dataset; 
      // let j=0,count=0;        
      // that.data.timer = setInterval(function () {          
      //    let time = +dataset.time*2          
      //    if(time > count) {            
      //       j = j % 3; j++;count++;            
      //       that.setData({ playId: dataset.id,playing: j})          
      //    } else {                     
      //       clearInterval(that.data.timer); //停止帧动画循环  
      //       that.setData({playId: -1,playing: 0})          
      //    }        
      // }, 500)
   }

 
 });