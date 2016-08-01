document.addEventListener("DOMContentLoaded", fileExplorer);

function fileExplorer() {
    App = {};
    (function (App) {

        class Element {
            constructor(data, $container) {
                this.type = data.type;
                this.name = data.name;
                this.path = data.path;
                this.open = false;
                this.$el = null;
            }
            addElementToDom($container) {
                this.createDomElement();
                $container.appendChild(this.$el);
            }
            createDomElement() {
                let $img = document.createElement('img');
                let $remove = document.createElement('img');
                let $text = document.createTextNode(this.name);
                $img.src = this.picture;
                $remove.src = 'img/remove.png';
                $remove.onclick = this.delete.bind(this);
                this.$el = document.createElement(this.tag);
                this.$el.appendChild($img);
                this.$el.appendChild($text);
                this.$el.appendChild($remove);
                this.$el.setAttribute('data-path', this.path);
            }
            delete(event) {
                event.stopPropagation();
                if(!confirm('Are you sure?')){ return; }
                this.$parent = event.target.parentNode.parentNode.getAttribute('data-path');
                let parentObj = App.searchDataInObj(this.$parent, this.file);
                for (let i = 0; i < parentObj.length; i++) {
                   if ( parentObj[i].name === this.name) {
                       parentObj.splice(i,1);
                       break;
                   }
                }
                event.target.parentNode.remove();
            }
        }

        class File extends Element {
            constructor(data, $container) {
                super(data, $container) ;
                this.tag = 'li';
                this.picture = 'img/file.png'
                this.addElementToDom($container);
                this.$el.onclick = this.click.bind(this);
            }
            click(event) {
                event.stopPropagation();
            };
        }

        class Folder extends Element {
            constructor(data, $container) {
                super(data, $container) ;
                this.children  = data.children;
                this.tag = 'ul';
                this.picture = 'img/closeFolder.png';
                this.addElementToDom($container);
                this.$el.onclick = this.click.bind(this);
            }
            click(event) {
                event.stopPropagation();

                if (event.target.tagName === 'UL' && this.open) {
                    this.open = false;
                    this.picture = 'img/closeFolder.png';
                    this.hideChildren(event.target);
                }
                else {
                    this.open = true;
                    this.picture = 'img/openFolder.png';
                    this.getChildren(event.target);
                }
                event.target.firstChild.src=this.picture;
            };
            getChildren($container){
                if ($container.children.length === 2) {
                    this.loadChildren($container);
                }
                else {
                    this.showChildren($container);
                }
            }
            loadChildren($container) {
                let $buttonsContainer = document.createElement('li');
                $container.appendChild($buttonsContainer);
                new NewFile($buttonsContainer);
                new NewFolder($buttonsContainer);
                for (let i = 0; i < this.children.length; i++) {
                    if (this.children[i].type === "folder") {
                        new Folder(this.children[i], $container);
                    }
                    if (this.children[i].type === "file") {
                        new File(this.children[i], $container);
                    }
                }
            };


            showChildren($container) {
                for (let i = 2; i < $container.children.length; i++) {
                    $container.children[i].hidden = false;
                }
            }
            hideChildren($container) {
                for (let i = 2; i < $container.children.length; i++) {
                    $container.children[i].hidden = true;
                }
            }
        }

        class NewData {
            constructor($container, picture) {
                this.picture = picture;
                this.addButtonToDom($container);
            }

            addButtonToDom($container) {
                this.$button = document.createElement('img');
                this.$button.src = this.picture;
                this.$button.onclick = this.createNewData.bind(this);
                $container.appendChild(this.$button);
            }
            getPath(event) {
                this.$parent = event.target.closest('ul');
                this.path = this.$parent.getAttribute('data-path');
            }

            addDataToObj(path, data){
                let curr = App.data;
                let j = 0, i = 0;
                path = path.split('/');
                path.shift();
                while ( i < path.length) {
                    if (curr[j].name === path[i]) {
                        curr = curr[j].children;
                        i++;
                    }
                    else {
                        j++;
                    }
                }
                curr.push(data);
            }
        }

        class NewFile extends NewData {
            constructor($container, picture = 'img/newFile.png') {
                super($container, picture = 'img/newFile.png');
                this.file = {};
            }
            createNewData(event) {
                event.stopPropagation();
                this.getPath(event);
                this.file.type = 'file';
                this.file.name = prompt('Enter the file name, please', '');
                while (this.file.name.indexOf('.') == -1) {
                    this.file.name = prompt('You must specify file type. Try again, please.', '');
                    if (!this.file.name) { return; }
                }
                this.file.path = `${this.path}/${this.file.name}`;
                App.searchDataInObj(this.path, this.file).push(this.file);
                new File(this.file, this.$parent);
            }
        }

        class NewFolder extends NewData {
            constructor($container, picture = 'img/newFolder.png') {
                super($container, picture = 'img/newFolder.png');
                this.folder = {};
            }
            createNewData(event) {
                event.stopPropagation();
                this.getPath(event);
                this.folder.children = [];
                this.folder.type = 'folder';
                this.folder.name = prompt('Enter the folder name, please', '');
                this.folder.path = `${this.path}/${this.folder.name}`;
                App.searchDataInObj(this.path, this.folder).push(this.folder);
                new Folder(this.folder, this.$parent);
            }
        }


        let $container;

        App.init = function () {

            $container = document.getElementById('file-explorer');
            $container.addEventListener("beforeunload", App.saveChanges);
            this.getJsonFromFile();
        };
        App.saveChanges = function ()  {
            let body = JSON.stringify(App.data);
        };
        App.getJsonFromFile = function () {
            let req = new XMLHttpRequest();
            req.open("GET", 'data/files.json', true);
            req.onreadystatechange = parseToObject.bind(this);
            req.send(null);
            function parseToObject() {
                if (req.readyState !== 4) {
                    return;
                };
                this.data = JSON.parse(req.responseText);
                App.initDataTree(this.data);
            }
        };

        App.initDataTree = function (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].type === "folder") {
                    new Folder(data[i], $container);
                }
                if (data[i].type === "file") {
                    new File(data[i], $container);
                }
            }
        };

        App.searchDataInObj = function (path, data){
            let curr = App.data;
            let j = 0, i = 0;
            path = path.split('/');
            path.shift();
            while ( i < path.length) {
                if (curr[j].name === path[i]) {
                    curr = curr[j].children;
                    i++;
                }
                else {
                    j++;
                }
            }
           return curr;
        }

        App.init();

    })(App, document);
}