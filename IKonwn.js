// 学到的内容
function acquire(){
  /*----------------------------------------------还有这种操作？？？------------------------------------------------*/
  // 1.使用void 0代替undefined,避免意外的undefined被重写的可能性。
  console.log(undefined === void 0);

  // 2.&&在赋值时的用法,返回最先能决定结果的值。 ||在赋值时，返回能决定表达式结果的值。
  var a = false && true; console.log(a);
  var b = false || 'adb'; console.log(b);
}
acquire();
