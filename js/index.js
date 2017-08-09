//名字空间模块
var app = {
	util:{}
};

//工具方法模块
app.util = {
	//定义取元素的方法
	$:function (selector,node) {
		return (node || document).querySelector(selector);
	},
	formatTime:function (ms) {
		console.log(ms);
		var d = new Date(ms);
		//个位数加0
		var pad = function (s) {
			if(s.toString().length === 1){
				s = '0' + s;
			}
			return s;
		};
		var year = d.getFullYear();
		var month = d.getMonth()+1;
		var day = d.getDate();
		var hour = d.getHours();
		var min = d.getMinutes();
		var seconds = d.getSeconds();
		return year + '-' + pad(month) + '-' + pad(day) + ' ' + pad(hour) + ':' + pad(min) + ':' + pad(seconds);

	}
};

//避免使用全局变量
(function (util) {
	var $ = util.$;
	var moveNote = null;
	var startX = '';
	var startY = '';
	var maxZIndex = 0;

	var noteTpl = `<i class="u-close"></i>
		<div class="u-editor" contenteditable="true"></div>
		<div class="u-timestamp">
			<span>更新：</span>
			<span class="time"></span>
		</div>`;

	//便签类主函数
	function Note(options) {
		var note = document.createElement("div");
		note.className = "m-note";
		note.innerHTML = noteTpl;
		note.style.left = options.left + 'px';
		note.style.top = options.top + 'px';
		note.style.zIndex = options.zIndex;
		document.body.appendChild(note);
		this.note = note;
		this.updateTime();
		this.addEvent();
	}


	//关闭当前便签方法
	Note.prototype.close = function (ev) {
		document.body.removeChild(this.note);
	};


	//时间更新方法
	Note.prototype.updateTime = function (ms) {

		var ts = $('.time',this.note);
		ms = ms || Date.now();
		ts.innerHTML = util.formatTime(ms);
	};


	//便签操作事件集合
	Note.prototype.addEvent = function () {
		//便签的mousedown事件
		var mousedownHandler = function (e) {
			moveNote = this.note;
			startX = e.clientX - moveNote.offsetLeft;
			startY = e.clientY - moveNote.offsetTop;

			//改变当前note的zIndex
			if(this.note.style.zIndex !== maxZIndex){
				this.note.style.zIndex = maxZIndex++;
			}
		}.bind(this);
		this.note.addEventListener('mousedown',mousedownHandler);

		//关闭处理程序
		var closeBtn = $('.u-close',this.note);
		var closeHandler = function () {
			this.close();
			//关闭便签移除当前的监听事件
			closeBtn.removeEventListener('click',closeHandler);
		}.bind(this);

		closeBtn.addEventListener('click',closeHandler);
	};



	//浏览器创建的监听事件
	document.addEventListener("DOMContentLoaded",function () {
		$("#create").addEventListener('click',function () {
			new Note({
				left:Math.ceil(Math.random() * (window.innerWidth -200)),
				top:Math.ceil(Math.random() * (window.innerHeight - 300)),
				zIndex:maxZIndex++
			});
		});


		//鼠标移动事件
		var mousemoveHandler = function (e) {
			if(!moveNote){
				return;
			}
			moveNote.style.left = e.clientX - startX + 'px';
			moveNote.style.top = e.clientY - startY + 'px';
		};
		//鼠标松开移除当前moveNote
		var mouseupHandler = function () {
			//注意此处
			moveNote = null;
		};
		//监听鼠标移动事件
		document.addEventListener('mousemove',mousemoveHandler);
		document.addEventListener('mouseup',mouseupHandler)
	})
})(app.util);
