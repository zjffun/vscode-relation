import React from "react";
import ReactDOM from "react-dom";

const checkResultsJSONString = document
  .getElementById("relationText")!
  .innerHTML.trim();

// fix script tag in JSON content
(window as any).checkResults = JSON.parse(
  checkResultsJSONString.replaceAll(
    "<___REPLACE_SCRIPT_TAG____/script>",
    "<" + "/script>"
  )
);

document.addEventListener("submitCreateRelation", (event: any) => {
  window.vsCodeApi.postMessage({
    type: "submitCreateRelation",
    payload: event.detail,
  });
});

document.addEventListener("relationDetailButtonClick", (event: any) => {
  window.vsCodeApi.postMessage({
    type: "relationDetailButtonClick",
    payload: event.detail,
  });
});

document.addEventListener("relationDeleteButtonClick", (event: any) => {
  window.vsCodeApi.postMessage({
    type: "relationDeleteButtonClick",
    payload: event.detail,
  });
});
