var path = Npm.require('path');
var fs = Npm.require('fs');
var mkdirp = Npm.require('mkdirp');
var echo = Npm.require('node-echo');
var beautify = Npm.require('js-beautify');
var npmContainerDir = path.resolve('./packages/riot-preprocessor');
var packagesJsonPath = path.resolve('./riot_packages.json');
var packageJsPath = path.resolve(npmContainerDir, 'package.js');
var compileRiotJsPath = path.resolve(npmContainerDir, 'compile-riot.js');
var postJsPath = path.resolve(npmContainerDir, 'post.js');
if (canProceed() && !fs.existsSync(packagesJsonPath)) {
  console.log('\n');
  console.log("-> creating `riot_packages.json` for the first time.");
  console.log("-> add your npm modules to `riot_packages.json`");
  console.log();
  fs.writeFileSync(packagesJsonPath, '{\n  \n}');
}
var preprocessorAdded = false;
if(fs.existsSync('.meteor/packages')) {
  fs.readFileSync('.meteor/packages').toString().split('\n').forEach(function(line) {
   if(/^\s*baysao:riot-preprocessor/.test(line)) {
    preprocessorAdded = true;
  }
})
}
if(!preprocessorAdded) {
 echo.sync("\nbaysao:riot-preprocessor", ">>", ".meteor/packages");
}
if (canProceed() && !fs.existsSync(npmContainerDir)) {
  console.log("=> Creating container package for npm modules");
    // create new npm container directory
    mkdirp.sync(npmContainerDir);
    // add package files
    // fs.writeFileSync(indexJsPath, getContent(_indexJsContent));
    fs.writeFileSync(compileRiotJsPath, getContent(_compileRiotJsContent));
    fs.writeFileSync(postJsPath, getContent(_postJsContent));
    fs.writeFileSync(packageJsPath, getContent(_packageJsContent));
    // add new container as a package
    var preprocessorAdded = false;
    if(fs.existsSync('.meteor/packages')) {
      fs.readFileSync('.meteor/packages').toString().split('\n').forEach(function(line) {
       if(/^\s*baysao:riot-preprocessor/.test(line)) {
        preprocessorAdded = true;
      }
    })
    }
    if(!preprocessorAdded) {
     echo.sync("\nbaysao:riot-preprocessor", ">>", ".meteor/packages");
   }

   // echo.sync("\nbaysao:riot-preprocessor", ">>", ".meteor/packages");
   console.log();
   console.log("-> npm support has been initialized.")
   console.log("-> please start your app again.");
   console.log();
    // if there is no npm-container when running `meteor`
    // we need to kill the current running process, otherwise
    // dependencies in the riot_packages.json won't get added
    process.exit(0);
  }
// check whether is this `meteor test-packages` or not
function canProceed() {
  var unAcceptableCommands = {
    'test-packages': 1,
    'publish': 1
  };
  if (process.argv.length > 2) {
    var command = process.argv[2];
    if (unAcceptableCommands[command]) {
      return false;
    }
  }
  return true;
}
// getContent inside a function
function getContent(func) {
  var lines = func.toString().split('\n');
    // Drop the function declaration and closing bracket
    var onlyBody = lines.slice(1, lines.length - 1);
    // Drop line number comments generated by Meteor, trim whitespace, make string
    onlyBody = _.map(onlyBody, function(line) {
      return line.slice(0, line.lastIndexOf("//")).trim();
    }).join('\n');
    // Make it look normal
    // return onlyBody;
    return beautify(onlyBody, {
      indent_size: 2
    });
  }
// Following function has been defined to just get the content inside them
// They are not executables
function _compileRiotJsContent() {
  var compiler = Npm.require('riot-compiler');

  function RiotCompiler() {}
  RiotCompiler.prototype.processFilesForTarget = function(files) {
    files.forEach(function(file) {
      var fileBasename = file.getBasename();
      var content = file.getContentsAsString();
      var output;
      var opts = {};
      if (/\.tag\.jade$/.test(fileBasename)) {
        opts = {
          template: "jade"
        };
      }
      if (/\.tag\.coffee$/.test(fileBasename)) {
        opts = {
          type: "coffee"
        };
      }
      if (/\.tag\.es6$/.test(fileBasename)) {
        opts = {
          type: "es6"
        };
      }
      if (/\.tag\.ls$/.test(fileBasename)) {
        opts = {
          type: "livescript"
        };
      }
      if (/\.tag\.babel$/.test(fileBasename)) {
        opts = {
          type: "babel"
        };
      }
      if (/\.tag\.sass$/.test(fileBasename)) {
        opts = {
          style: "sass"
        };
      }
      if (/\.tag\.scss$/.test(fileBasename)) {
        opts = {
          style: "scss"
        };
      }
      if (/\.tag\.less$/.test(fileBasename)) {
        opts = {
          style: "less"
        };
      }
      if (/\.tag\.styl$/.test(fileBasename)) {
        opts = {
          style: "stylus"
        };
      }
      try{
        output = compiler.compile(content, opts);
        file.addJavaScript({
          data: output,
          path: file.getPathInPackage() + '.js'
        });
      }catch(e){
      }
    });
};
Plugin.registerCompiler({
  extensions: [
  "tag", "tag.jade", "tag.coffee", "tag.es6", "tag.ls", "tag.ts", 
  "tag.babel", "tag.sass", "tag.scss", "tag.less", "tag.styl"
  ],
  filenames: []
}, function() {
  var compiler = new RiotCompiler();
  return compiler;
});
}

function _postJsContent() {
  if (window && window.riot) Riot = window.riot;
}

function _packageJsContent() {
  var path = Npm.require('path');
  var fs = Npm.require('fs');
  var riotVersion = "2.3.1";
  Package.describe({
    summary: "Riot PreProcessor",
    version: riotVersion + "-16",
    name: "baysao:riot-preprocessor",
  });
  Npm.depends({
    "riot": riotVersion
  });
  var pluginInfo = {
    name: "compileRiot",
    use: [],
    sources: ['compile-riot.js'],
    npmDependencies: {
      "riot-compiler": "2.3.11"
    }
  };
  var packagesJsonFile = path.resolve('./riot_packages.json');
  try {
    var fileContent = fs.readFileSync(packagesJsonFile);
    var packages = JSON.parse(fileContent.toString());
    for (var i in packages) {
      pluginInfo.npmDependencies[i] = packages[i];
    }
    Package.registerBuildPlugin(pluginInfo);
        // Npm.depends(packages);
      } catch (ex) {
        console.error('ERROR: riot_packages.json parsing error [ ' + ex.message + ' ]');
      }
      Package.onUse(function(api) {
        api.use('isobuild:compiler-plugin@1.0.0');
        if (api.addAssets) {
          api.addAssets('../../riot_packages.json', 'server');
        } else {
          api.addFiles('../../riot_packages.json', 'server', {
            isAsset: true
          });
        }
        api.addFiles(['.npm/package/node_modules/riot/riot.min.js', 'post.js'], ['client']);
        api.export('Riot');
      });
    }