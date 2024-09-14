// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const axios = require("axios");
const qs = require("qs"); // 引入qs库
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "jj_data_async" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand("DataAsync", async () => {
    const panel = vscode.window.createWebviewPanel(
      "multipleDropdowns",
      "缙嘉数据同步",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    // 调用获取数据的函数
    const databaseConfigs = await fetchData(
      "http://10.10.22.39:5050/api/system/getdatabase"
    );
    const asyncTypeConfigs = await fetchData(
      "http://10.10.22.39:5050/api/system/getasynctype"
    );

    let htmlContent = getWebviewContent(context);
    htmlContent = htmlContent.replace(
      '"<!-- DROPDOWN_DATA -->"',
      JSON.stringify({
        databaseConfigs: databaseConfigs,
        asyncTypeConfigs: asyncTypeConfigs,
      })
    );

    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "submit":
            // vscode.window.showInformationMessage(message.fromDbId);
            const params = parseUserInput(message);
            await execAsync(params);
        }
      },
      undefined,
      context.subscriptions
    );

    return;

    // 显示下拉框
    // 定义键值对选项
    const options = [
      { label: "dev", description: "开发库", value: 1 },
      { label: "sit", description: "测试库", value: 2 },
      { label: "pro", description: "生产库", value: 3 },
      { label: "kol", description: "kol生产库", value: 7 },
    ];

    // 显示下拉框
    const beginOption = await vscode.window.showQuickPick(options, {
      placeHolder: "选择一个选项",
      canPickMany: false,
    });

    // 处理用户输入的内容
    if (beginOption !== undefined) {
      vscode.window.showInformationMessage(
        `你选择的内容是: ${beginOption.label}, 值是: ${beginOption.value}`
      );
    } else {
      vscode.window.showErrorMessage("没有选择任何内容");
    }

    // 显示下拉框
    const endOption = await vscode.window.showQuickPick(options, {
      placeHolder: "选择一个选项",
      canPickMany: false,
    });

    // 处理用户输入的内容
    if (endOption !== undefined) {
      vscode.window.showInformationMessage(
        `你选择的内容是: ${endOption.label}, 值是: ${endOption.value}`
      );
    } else {
      vscode.window.showErrorMessage("没有选择任何内容");
    }

    return;

    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      const params = {
        FromDbSelect: "sit",
        FromDbId: 2,
        ToDbSelect: "dev",
        ToDbId: 1,
        AsyncTypeSelect: "表头",
        AsyncTypeId: "TableHeader",
        AsyncCode: selectedText,
      };
      try {
        const response = await axios.default.post(
          "http://10.10.22.39:5050/api/system/SaveMenuAsync",
          qs.stringify(params),
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
            },
          }
        );

        const data = response.data;

        console.log("data", data);

        if (data.IsSuccess) {
          vscode.window.showInformationMessage(data.Data);
        } else {
          vscode.window.showErrorMessage(data.Message);
        }
      } catch (error) {
        vscode.window.showErrorMessage("服务器请求错误！");
      }
    } else {
      vscode.window.showErrorMessage("请先选中文本！");
    }
  });

  context.subscriptions.push(disposable);
}

// 解析用户输入
/**
 * @param {{ fromDbId: any; fromDbSelect: any; toDbId: any; toDbSelect: any; asyncTypeId: any; asyncTypeSelect: any; asyncCode: any; }} message
 */
function parseUserInput(message) {
  return {
    FromDbId: message.fromDbId,
    FromDbSelect: message.fromDbSelect,
    ToDbId: message.toDbId,
    ToDbSelect: message.toDbSelect,
    AsyncTypeId: message.asyncTypeId,
    AsyncTypeSelect: message.asyncTypeSelect,
    AsyncCode: message.asyncCode,
  };
}

// post 请求 http://10.10.22.39:5050/api/system/getdatabase接口
async function fetchData(url) {
  const response = await axios.default.post(url);
  const data = response.data;

  console.log("data", data);

  if (data.IsSuccess) {
    return data.Data;
  } else {
    vscode.window.showErrorMessage(JSON.stringify(data.Data));
  }
}

// 执行异步请求
async function execAsync(params) {
  try {
    const response = await axios.default.post(
      "http://10.10.22.39:5050/api/system/SaveMenuAsync",
      qs.stringify(params),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    );

    const data = response.data;

    console.log("data", data);

    if (data.IsSuccess) {
      vscode.window.showInformationMessage(JSON.stringify(data.Data));
    } else {
      vscode.window.showErrorMessage(JSON.stringify(data.Data));
    }
  } catch (error) {
    vscode.window.showErrorMessage("服务器请求错误！");
  }
}

function getWebviewContent(context) {
  const htmlPath = path.join(context.extensionPath, "viewport.html");
  return fs.readFileSync(htmlPath, "utf8");
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
