import React from "react";
import ReactDOM from "react-dom";

const checkResultsJSONString =
  document.getElementById("viewCheckResultsText")!.textContent || "";

(window as any).__VIEW_CHECK_RESULTS__ = JSON.parse(checkResultsJSONString);

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
