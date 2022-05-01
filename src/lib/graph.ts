const horizontal = "─"; // U+2500
const vertical = "│"; // U+2502
const upLeft = "┌"; //U+250C
const upRight = "┐"; //U+2510
const downLeft = "└"; //U+2514
const downRight = "┘"; //U+2518
const verticalLeft = "├";
const verticalRight = "┤";
const horizontalDown = "┴";
const horizontalUp = "┬";
const center = "┼";

type Stringable = { toString(): string };

function alineString(
  input: Stringable,
  length: number,
  aline: "left" | "center" | "right"
): string {
  let output = input.toString();
  switch (aline /*.toLowerCase()*/) {
    case "right":
      output = output.padStart(length, " ");
      break;
    case "center":
      output = output.padStart(length / 2 + output.length / 2, " ");
      output = output.padEnd(length, " ");
      break;
    case "left":
      output = output.padEnd(length, " ");
      break;
  }
  return output;
}

function lineHorizontal(
  char: string[],
  h: number | number[],
  char2: string | null = null
): string {
  //let debug = 1;
  let line = char[0];
  if (char2 == null) {
    //debug += h
    for (let i = 0; i < h; i++) {
      line += horizontal;
    }
  } else if (h instanceof Array) {
    for (let i = 0; i < h.length; i++) {
      //debug += h[i]
      for (let j = 0; j < h[i]; j++) {
        line += horizontal;
      }
      if (i < h.length - 1) {
        line += char2; // debug++;
      }
    }
  }
  line += char[1]; //+debug+1;
  return line;
}

export function table(
  matrix: Stringable[][],
  horizontalSeparator = "",
  aline:
    | "left"
    | "center"
    | "right"
    | Array<"left" | "center" | "right"> = "left"
): string {
  const rows = matrix.length;
  const columns = matrix[0].length;
  const lengthPerColumn = new Array<number>(columns).fill(0);
  const separatorPerRow = [];

  let line = "";
  let all = false;
  let alinePerColumn;
  let separator;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j].toString().length > lengthPerColumn[j]) {
        lengthPerColumn[j] = matrix[i][j].toString().length;
      }
    }
  }
  if (Array.isArray(aline)) {
    alinePerColumn = aline;
  } else {
    alinePerColumn = new Array(columns).fill(aline);
  }
  if (Array.isArray(horizontalSeparator)) {
    separator = horizontalSeparator;
  } else {
    separator = [horizontalSeparator];
  }
  for (let i = 0; i < separator.length; i++) {
    if (typeof separator[i] == "string")
      separator[i] = separator[i].toLowerCase();
    switch (separator[i]) {
      case "both":
        separatorPerRow.push(0);
        separatorPerRow.push(rows - 2);
        break;
      case "first":
        separatorPerRow.push(0);
        break;
      case "last":
        separatorPerRow.push(rows - 2);
        break;
      case "all":
        all = true;
        break;
      default:
        if (typeof separator[i] == "number") {
          separatorPerRow.push(parseInt(separator[i]));
          separatorPerRow.push(parseInt(separator[i]) + 1);
        }
        break;
    }
  }
  line +=
    lineHorizontal([upLeft, upRight], lengthPerColumn, horizontalUp) + "\n";
  for (let i = 0; i < rows; i++) {
    line += vertical;
    for (let j = 0; j < matrix[i].length; j++) {
      line +=
        alineString(matrix[i][j], lengthPerColumn[j], alinePerColumn[j]) +
        vertical;
    }
    line += "\n";
    if (i < rows - 1) {
      if (all || separatorPerRow.includes(i))
        line +=
          lineHorizontal(
            [verticalLeft, verticalRight],
            lengthPerColumn,
            center
          ) + "\n";
    }
  }
  line += lineHorizontal(
    [downLeft, downRight],
    lengthPerColumn,
    horizontalDown
  );

  return line;
}
