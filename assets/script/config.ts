export const gridSizeX = 7;
export const gridSizeY = 8;
export const tileSize = 120;
export const shapesFn = [];

const getFullRow = ({
  y,
  startX,
  endX,
  offsetX = 0,
  offsetY = 0,
  step = 1,
}) => {
  const shape = [];
  for (let i = startX; i < endX; i += step) {
    shape.push({
      x: Math.floor(i),
      y: y,
      ox: i - Math.floor(i),
      oy: offsetY,
    });
  }
  return shape;
};
const getFullColumn = ({
  x,
  startY,
  endY,
  offsetX = 0,
  offsetY = 0,
  step = 1,
}) => {
  const shape = [];
  for (let i = startY; i < endY; i += step) {
    shape.push({
      x,
      y: Math.floor(i),
      ox: offsetX,
      oy: offsetY + i - Math.floor(i),
    });
  }
  return shape;
};
const getFullShape = ({ startX, startY, endX, endY, offsetX, offsetY }) => {
  const shape = [];
  for (let x = startX; x < endX; x++) {
    shape.push(...getFullColumn({ x, startY, endY, offsetX, offsetY }));
  }
  return shape;
};

shapesFn.push(() => {
  const result = [];
  for (let i = 0; i < 2; i++) {
    const shape = [];
    const oy = -0.5 * i;
    for (let j = 0; j < 3; j++) {
      const x = 1.5 + j * 1.5;
      shape.push({
        x: x,
        y: 1,
        ox: 0,
        oy: oy,
      });
      i === 0 &&
        shape.push({
          x: x,
          y: 3,
          ox: 0,
          oy: oy,
        });
      i === 0 &&
        shape.push({
          x: x,
          y: 5,
          ox: 0,
          oy: oy,
        });
    }
    result.push(shape);
  }
  return result;
});
shapesFn.push(() => {
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(
      getFullShape({
        startX: 1,
        startY: 0,
        endX: gridSizeX - 1,
        endY: gridSizeY,
        offsetX: 0,
        offsetY: 0,
      })
    );

    result.push(
      getFullShape({
        startX: 1,
        startY: 0,
        endX: gridSizeX - 2,
        endY: gridSizeY - 1,
        offsetX: 0.5,
        offsetY: 0.5,
      })
    );
  }
  result.push(
    ...getFullColumn({
      x: 0,
      startY: 0.5,
      endY: gridSizeY - 1.5,
      step: 0.5,
    })
      .map((g) => [g])
      .reverse()
  );
  result.push(
    ...getFullColumn({
      x: gridSizeX - 1,
      startY: 0.5,
      endY: gridSizeY - 1.5,
      step: 0.5,
    })
      .map((g) => [g])
      .reverse()
  );
  return result;
});
