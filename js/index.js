//名字空间模块
var app = {
	util:{},
	store:{} //存储模块——store模块,localStorage属于比较通用的函数，故单独作为一个模块写出来
};

//工具方法模块
app.util = {
	//定义取元素的方法
	$:function (selector,node) {
		return (node || document).querySelector(selector);
	},
	formatTime:function (ms) {
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

//store模块（存储模块）
app.store = {
	__store_key:'__sticky_note__',  	//设置localStorage的键值
	//获取存储数据——相当于getItem
	get:function (id) {
		var notes = this.getNotes();
		return notes[id] || {};
	},
	//设置存储数据——相当于setItem
	set:function (id,content) {
		//取到所有的note属性
		var notes = this.getNotes();
		//当前属性名存在，则更新
		if(notes[id]){
			//更新content——Object.assign 将content属性值拷贝给notes[id]
			Object.assign(notes[id],content)
		}else{
			//当前属性名不存在，则创建一个新的
			notes[id] = content;
		}
		//设置本地存储，需要字符串格式
		localStorage[this.__store_key] = JSON.stringify(notes);
		console.log('saved note: id: ' + id + ' content: ' + JSON.stringify(notes[id]));
	},
	//关闭时移除localStorage
	remove:function (id) {
		var notes = this.getNotes();
		delete notes[id];
		localStorage[this.__store_key] = JSON.stringify(notes);
	},
	//获取当前localStorage存储的所有属性，以JSON形式返回
	getNotes:function () {
		//localStorage为字符串形式，需要将其转换为json对象，内容为所有已保存的属性
		return JSON.parse(localStorage[this.__store_key] || '{}')
	}
};


//避免使用全局变量
(function (util,store) {
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
		note.id = options.id || 'm-note-' + Date.now();
		note.className = "m-note";
		note.innerHTML = noteTpl;
		$('.u-editor', note).innerHTML = options.content || '';
		note.style.left = options.left + 'px';
		note.style.top = options.top + 'px';
		note.style.zIndex = options.zIndex;
		document.body.appendChild(note);
		this.note = note;
		this.updateTime(options.updateTime);
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
		this.updateTimeInMS = ms;
	};

	Note.prototype.save = function () {
		store.set(this.note.id, {
			left: this.note.offsetLeft,
			top: this.note.offsetTop,
			zIndex: parseInt(this.note.style.zIndex),
			content: $('.u-editor', this.note).innerHTML,
			updateTime: this.updateTimeInMS
		});
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
				store.set(this.note.id,{
					zIndex:maxZIndex
				});
			}
		}.bind(this);
		this.note.addEventListener('mousedown',mousedownHandler);

		//便签输入事件
		var editor = $('.u-editor',this.note);

		var inputTimer;
		//便签监听处理事件
		var inputHandler = function() {
			var content = editor.innerHTML;
			//每输入一次即进行保存，为了防止立刻保存提升性能，使用setTimeout设置动态加载延迟
			clearTimeout(inputTimer);
			inputTimer = setTimeout(function () {
				var time = Date.now();
				store.set(this.note.id,{
					content:content,
					updateTime:time
				});
				this.updateTime(time)
			}.bind(this),300)
		}.bind(this);

		editor.addEventListener('input',inputHandler);

		//关闭处理程序
		var closeBtn = $('.u-close',this.note);
		var closeHandler = function () {
			//移除本地储存
			store.remove(this.note.id);
			//关闭窗口
			this.close();
			//关闭便签移除当前的监听事件
			closeBtn.removeEventListener('click',closeHandler);
		}.bind(this);

		closeBtn.addEventListener('click',closeHandler);
	};



	//浏览器创建的监听事件
	document.addEventListener("DOMContentLoaded",function () {
		$("#create").addEventListener('click',function () {
			var note = new Note({
				left:Math.ceil(Math.random() * (window.innerWidth -200)),
				top:Math.ceil(Math.random() * (window.innerHeight - 300)),
				zIndex:maxZIndex++
			});
			note.save();
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
			if(!moveNote){
				return
			}
			//鼠标松开后保存便签位置
			store.set(moveNote.id,{
				left:moveNote.offsetLeft,
				top:moveNote.offsetTop
			});
			//注意此处
			moveNote = null;
		};
		//监听鼠标移动事件
		document.addEventListener('mousemove',mousemoveHandler);
		document.addEventListener('mouseup',mouseupHandler);

		//初始化notes
		var notes = store.getNotes();
		Object.keys(notes).forEach(function (id) {
			var options = notes[id];
			if (maxZIndex < options.zIndex) {
				maxZIndex = options.zIndex;
			}
			new Note(Object.assign(options, {
				id: id
			}));
		});
		maxZIndex += 1;
	});
})(app.util,app.store);
