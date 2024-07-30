/* eslint-disable react-hooks/exhaustive-deps */
import Konva from "konva";
import "./App.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RiArrowLeftUpLine,
  RiCircleLine,
  RiPencilLine,
  RiSquareLine,
  RiDownload2Fill,
  RiCursorFill,
  RiEraserLine,
} from "react-icons/ri";
import { HiOutlinePhoto } from "react-icons/hi2";
import {
  Arrow,
  Circle,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
  Image as KonvaImage,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { MdOutlineColorize } from "react-icons/md";
import { KonvaEventObject } from "konva/lib/Node";

enum Options {
  SELECT,
  RECTANGLE,
  CIRCLE,
  SCRIBBLE,
  ARROW,
  ERASER,
}

interface ShapeBase {
  id: string;
  strokeColor: string;
  fillColor: string;
  type: string;
}

interface Rectangle extends ShapeBase {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Circle extends ShapeBase {
  x: number;
  y: number;
  radius: number;
}

interface Arrow extends ShapeBase {
  points: number[];
}

interface Scribble extends ShapeBase {
  points: number[];
}

interface Text extends ShapeBase {
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

interface Image extends ShapeBase {
  image: HTMLImageElement;
}

type allShapes = Rectangle | Circle | Arrow | Scribble | Text | Image;

const App: React.FC = () => {
  const [action, setAction] = useState<Options>(Options.SELECT);
  const [fillColor, setFillColor] = useState<string>("transparent");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [shapes, setShapes] = useState<allShapes[]>([]);
  // const [image, setImage] = useState<HTMLImageElement>();

  const [colorOption, setColorOption] = useState<string>();

  const importImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const imageUrl = URL.createObjectURL(e.target.files?.[0]);
      const image = new Image();
      image.src = imageUrl;
      setShapes((prevShapes) => [
        ...prevShapes,
        {
          id: uuidv4(),
          image: image,
          type: "image",
        } as Image,
      ]);
    }
  }, []);

  const handleUndo = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "z") {
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
        }
        setShapes((prevShapes) => {
          const newShapes = [...prevShapes];
          newShapes.pop();
          return newShapes;
        });
      }
    },
    [shapes]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleUndo);

    return () => {
      window.removeEventListener("keydown", handleUndo);
    };
  }, [handleUndo]);

  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const isPainting = useRef<boolean>(false);
  const currentShapeId = useRef<string | null>(null);

  const isDraggable = action === Options.SELECT;

  const onPointerUp = () => {
    isPainting.current = false;
    if (stageRef.current) {
      stageRef.current.container().style.cursor = isDraggable
        ? "grab"
        : "default";
    }
  };

  const onPointerDown = () => {
    if (action === Options.SELECT) return;

    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = "crosshair";
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;
        const id = uuidv4();
        currentShapeId.current = id;
        isPainting.current = true;

        switch (action) {
          case Options.RECTANGLE:
            setShapes((prevShapes) => [
              ...prevShapes,
              {
                id,
                x,
                y,
                strokeColor,
                fillColor,
                width: 5,
                height: 5,
                type: "rectangle",
              } as Rectangle,
            ]);
            break;
          case Options.CIRCLE:
            setShapes((prevShapes) => [
              ...prevShapes,
              {
                id,
                x,
                y,
                strokeColor,
                fillColor,
                radius: 5,
                type: "circle",
              } as Circle,
            ]);
            break;
          case Options.ARROW:
            setShapes((prevShapes) => [
              ...prevShapes,
              {
                id,
                points: [x, y, x + 5, y + 5],
                strokeColor,
                fillColor,
                type: "arrow",
              } as Arrow,
            ]);
            break;
          case Options.SCRIBBLE:
            setShapes((prevShapes) => [
              ...prevShapes,
              {
                id,
                points: [x, y],
                strokeColor,
                fillColor,
                type: "scribble",
              } as Scribble,
            ]);
            break;
        }
      }
    }
  };

  const onPointerMove = () => {
    if (action === Options.SELECT || !isPainting.current) return;

    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = "crosshair";
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;

        switch (action) {
          case Options.RECTANGLE:
            setShapes((shapes) =>
              shapes.map((shape) => {
                const rectangle = shape as Rectangle;
                if (
                  rectangle.type === "rectangle" &&
                  rectangle.id === currentShapeId.current
                ) {
                  return {
                    ...rectangle,
                    width: x - rectangle.x,
                    height: y - rectangle.y,
                  };
                }
                return rectangle;
              })
            );
            break;
          case Options.CIRCLE:
            setShapes((shapes) =>
              shapes.map((shape) => {
                const circle = shape as Circle;
                if (
                  circle.type === "circle" &&
                  circle.id === currentShapeId.current
                ) {
                  return {
                    ...circle,
                    radius: Math.sqrt(
                      (y - circle.y) ** 2 + (x - circle.x) ** 2
                    ),
                  };
                }
                return circle;
              })
            );
            break;
          case Options.ARROW:
            setShapes((arrows) =>
              arrows.map((shape) => {
                const arrow = shape as Arrow;
                if (
                  arrow.type === "arrow" &&
                  arrow.id === currentShapeId.current
                ) {
                  return {
                    ...arrow,
                    points: [arrow.points[0], arrow.points[1], x, y],
                  };
                }
                return arrow;
              })
            );
            break;
          case Options.SCRIBBLE:
            setShapes((shapes) =>
              shapes.map((shape) => {
                const scribble = shape as Scribble;
                if (
                  scribble.type === "scribble" &&
                  scribble.id === currentShapeId.current
                ) {
                  return {
                    ...scribble,
                    points: [...scribble.points, x, y],
                  };
                }
                return scribble;
              })
            );
            break;
        }
      }
    }
  };

  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement("a");
      link.href = uri;
      link.download = "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOnClick = (e: KonvaEventObject<MouseEvent>) => {
    if (action === Options.ERASER) {
      const currentShapeId = e.target.getAttr("id");
      setShapes((prevShapes) =>
        prevShapes.filter((shape) => shape.id !== currentShapeId)
      );
    } else {
      if (action !== Options.SELECT) return;

      if (transformerRef.current) {
        transformerRef.current.nodes([e.currentTarget]);
      }
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>, shapeId: string) => {
    const { x, y } = e.target.position();
    setShapes((prevShapes) =>
      prevShapes.map((shape) => {
        if (shape.id === shapeId) {
          return {
            ...shape,
            x,
            y,
          };
        }
        return shape;
      })
    );
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "transparent") {
      setColorOption("transparent");
      setFillColor("transparent");
    } else {
      setColorOption("color");
      setFillColor("#000000");
    }
  };

  const handleDblClick = () => {
    if (stageRef.current) {
      const stage = stageRef.current.getStage();
      const pointerPosition = stage.getPointerPosition();
      setShapes((prevShapes) => [
        ...prevShapes,
        {
          id: uuidv4(),
          x: pointerPosition?.x,
          y: pointerPosition?.y,
          type: "text",
          fontSize: 20,
          text: "Some text here",
        } as Text,
      ]);
    }
  };

  const handleTextDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
    const textNode = e.target;

    const textPosition = e.target.getAbsolutePosition();
    const text = e.target.getAttr("text");
    const width = e.target.getAttr("width");

    // // so position of textarea will be the sum of positions above:
    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // create textarea and style it
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width = width;
    textarea.style.outline = "none";
    textarea.style.resize = "horizontal";

    const adjustTextareaHeight = () => {
      textarea.style.height = "auto"; // Reset the height
      textarea.style.height = textarea.scrollHeight + "px"; // Set to scroll height
    };

    // Initial height adjustment in case the textarea has content on load
    adjustTextareaHeight();

    // Adjust height on input event
    textarea.addEventListener("input", adjustTextareaHeight);

    // Adjust height on window resize
    window.addEventListener("resize", adjustTextareaHeight);

    textarea.focus();

    textarea.addEventListener("keydown", function (e) {
      if (e.code === "Enter") {
        // hide on enter
        textNode.setAttr("text", textarea.value);
        document.body.removeChild(textarea);
      }
    });
  };

  return (
    <>
      <div className="z-[1] bg-white grid grid-cols-10 w-[fit-content] absolute shadow-lg top-4 left-[50%] -translate-x-[50%]">
        <span
          className={`appbar-options ${
            action === Options.SELECT ? "bg-gray-200" : ""
          }`}
          onClick={() => setAction(Options.SELECT)}
        >
          <RiCursorFill size={"2rem"} />
        </span>
        <span
          className={`appbar-options ${
            action === Options.RECTANGLE ? "bg-gray-200" : ""
          }`}
          onClick={() => setAction(Options.RECTANGLE)}
        >
          <RiSquareLine size={"2rem"} />
        </span>
        <span
          className={`appbar-options ${
            action === Options.CIRCLE ? "bg-gray-200" : ""
          }`}
          onClick={() => setAction(Options.CIRCLE)}
        >
          <RiCircleLine size={"2rem"} />
        </span>
        <span
          className={`appbar-options ${
            action === Options.ARROW ? "bg-gray-200" : ""
          }`}
          onClick={() => setAction(Options.ARROW)}
        >
          <RiArrowLeftUpLine size={"2rem"} />
        </span>
        <span
          className={`appbar-options ${
            action === Options.SCRIBBLE ? "bg-gray-200" : ""
          }`}
          onClick={() => setAction(Options.SCRIBBLE)}
        >
          <RiPencilLine size={"2rem"} />
        </span>
        <span
          className={`appbar-options ${
            action === Options.ERASER ? "bg-gray-200" : ""
          }`}
          onClick={() => setAction(Options.ERASER)}
        >
          <RiEraserLine size={"2rem"} />
        </span>
        <div className="appbar-options relative">
          <select
            value={colorOption}
            onChange={handleColorChange}
            className="border border-black w-full p-1"
          >
            <option value="transparent">transparent</option>
            <option value="color">fill</option>
          </select>
          {colorOption === "color" && (
            <input
              value={colorOption === "color" ? fillColor : "#000000"}
              type="color"
              onChange={(e) => setFillColor(e.target.value)}
              className="cursor-pointer mt-2 absolute w-[50%] h-[45%] left-1 bottom-[0.75rem]"
            />
          )}
        </div>
        <div className="appbar-options relative">
          <label htmlFor="strokeColor">
            <MdOutlineColorize size={"2rem"} color={strokeColor} />
          </label>
          <input
            id="strokeColor"
            value={strokeColor}
            type="color"
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-[50%] w-[50%] opacity-0 absolute cursor-pointer"
          />
        </div>
        <span className="appbar-options relative">
          <label htmlFor="image-input">
            <HiOutlinePhoto size={"2rem"} />
          </label>
          <input
            id="image-input"
            type="file"
            onChange={importImage}
            className="absolute opacity-0 left-0 right-0"
          />
        </span>
        <span className="appbar-options" onClick={handleExport}>
          <RiDownload2Fill size={"2rem"} />
        </span>
      </div>
      <main className="w-screen h-screen mx-auto">
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          onPointerUp={onPointerUp}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
        >
          <Layer id="layer">
            <Rect
              x={0}
              y={0}
              width={window.innerWidth}
              height={window.innerHeight}
              fill="#ffffff"
              id="bg"
              onClick={() => transformerRef.current?.nodes([])}
              onDblClick={handleDblClick}
            />

            {shapes.map((shape) => {
              if (shape.type === "rectangle") {
                const rect = shape as Rectangle;
                return (
                  <Rect
                    key={shape.id}
                    id={shape.id}
                    x={rect.x}
                    y={rect.y}
                    stroke={rect.strokeColor}
                    strokeWidth={2}
                    fill={rect.fillColor}
                    height={rect.height}
                    width={rect.width}
                    draggable={isDraggable}
                    onClick={handleOnClick}
                    onDblClick={handleDblClick}
                    className="z-0"
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  />
                );
              } else if (shape.type === "circle") {
                const circle = shape as Circle;
                return (
                  <Circle
                    key={shape.id}
                    id={shape.id}
                    radius={circle.radius}
                    x={circle.x}
                    y={circle.y}
                    stroke={circle.strokeColor}
                    strokeWidth={2}
                    fill={circle.fillColor}
                    draggable={isDraggable}
                    onClick={handleOnClick}
                    onDblClick={handleDblClick}
                    className="z-0"
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  />
                );
              } else if (shape.type === "arrow") {
                const arrow = shape as Arrow;
                return (
                  <Arrow
                    key={shape.id}
                    id={shape.id}
                    points={arrow.points}
                    stroke={arrow.strokeColor}
                    strokeWidth={2}
                    fill={arrow.fillColor}
                    draggable={isDraggable}
                    onClick={handleOnClick}
                    className="z-0"
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  />
                );
              } else if (shape.type === "scribble") {
                const scribble = shape as Scribble;
                return (
                  <Line
                    key={shape.id}
                    id={shape.id}
                    lineCap="round"
                    lineJoin="round"
                    points={scribble.points}
                    stroke={scribble.strokeColor}
                    strokeWidth={2}
                    fill={scribble.fillColor}
                    draggable={isDraggable}
                    onClick={handleOnClick}
                    className="z-0"
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  />
                );
              } else if (shape.type === "text") {
                const text = shape as Text;
                return (
                  <Text
                    key={shape.id}
                    id={shape.id}
                    x={text.x}
                    y={text.y}
                    fontSize={text.fontSize}
                    text={text.text}
                    draggable={isDraggable}
                    onClick={handleOnClick}
                    className="z-0"
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                    onDblClick={handleTextDblClick}
                  />
                );
              } else if (shape.type === "image") {
                const image = shape as Image;
                return (
                  <KonvaImage
                    key={shape.id}
                    id={shape.id}
                    image={image.image}
                    x={200}
                    y={200}
                    draggable={isDraggable}
                    onClick={handleOnClick}
                    className="z-0"
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  />
                );
              }
            })}

            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>
      </main>
    </>
  );
};

export default App;
