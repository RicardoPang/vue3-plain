// 求最长递增子序列的个数（贪心算法+二分查找）
function getSequence(arr) {
  const len = arr.length;
  const result = [0]; // 以默认第0个为基准来做序列
  const p = new Array(len).fill(0); // 最后要标记索引 放的东西不用关心 但是要和数组一样长

  let start;
  let end;
  let middle;
  let resultLastIndex;
  for (let i = 0; i < len; i++) {
    let arrI = arr[i];
    if (arrI !== 0) {
      // 因为vue里面的序列中0意味着需要创建
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        // 比较最后一项和当前项的值，如果比最后一项大，则将当前索引放到结果集中
        result.push(i);
        p[i] = resultLastIndex; //当前放到末尾的要记住它前面的那个人是谁
        continue;
      }
      // 这里我们需要通过二分查找，在结果集中找到比当前值大的，用当前值的索引将其替换掉
      // 递增序列，采用二分查找是最快的
      start = 0;
      end = result.length - 1;
      while (start < end) {
        // start===end的时候就停止了，这个二分查找再找索引
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      // 找到中间值之后 我们需要做替换操作 start / end
      if (arr[result[end]] > arrI) {
        // 这里用当前这一项，替换掉已有的比当前大的那一项。更有潜力的我需要
        result[end] = i;
        p[i] = result[end - 1]; // 记住它的前一个人是谁
      }
    }
  }

  // 通过最后一项进行回溯
  let i = result.length;
  let last = result[i - 1]; // 找到最后一项了
  while (i-- > 0) {
    // 倒序追溯
    result[i] = last; // 最后一项是确定的
    last = p[last];
  }

  return result;
}
// console.log(getSequence([3, 2, 8, 9, 5, 6, 7, 11, 15]));
console.log(getSequence([3, 2, 8, 9, 5, 6, 7, 11, 15, 4]));
console.log(getSequence([5, 3, 4, 0]));
console.log(getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]));

// 找更有潜力的
// 3
// 2
// 2 8
// 2 8 9
// 2 5 9
// 2 5 6
// 2 5 6 7 11 15

// 1.思路就是当前这一项比我们最后一项大则直接放到末尾
// 2.如果当前这一项比最后一项小，需要在序列中通过二分查找找到比当前大的这一项，用它替换掉
// 3.最优的情况，就是默认递增
// 我们可以通过标记索引的方式，最终通过最后一项将结果还原
