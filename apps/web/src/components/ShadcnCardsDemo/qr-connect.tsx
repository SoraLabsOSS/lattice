import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sora-lattice/ui/components/card";

const qrCells = [
  "111111100101101111111",
  "100000101001001000001",
  "101110101111101011101",
  "101110100100001011101",
  "101110101010101011101",
  "100000100111001000001",
  "111111101010101111111",
  "000000001101000000000",
  "101011111001111010110",
  "010100001110010101001",
  "111010111011101111010",
  "001101000101000010101",
  "110111101111010111011",
  "000000001001010001010",
  "111111101101111101001",
  "100000100010001001111",
  "101110101011101110100",
  "101110100110100010011",
  "101110101000111101110",
  "100000101101000011001",
  "111111101011101101111",
];

export function QrConnect() {
  return (
    <Card>
      <CardContent className="flex justify-center pt-6">
        <div className="rounded-xl border bg-white p-4">
          <svg
            aria-label="Connect device QR code"
            className="size-40 text-black"
            role="img"
            shapeRendering="crispEdges"
            viewBox="0 0 21 21"
          >
            <rect fill="white" height="21" width="21" />
            {qrCells.map((row, y) =>
              [...row].map((cell, x) =>
                cell === "1" ? (
                  <rect height="1" key={`${x}-${y}`} width="1" x={x} y={y} />
                ) : null
              )
            )}
          </svg>
        </div>
      </CardContent>
      <CardHeader className="text-center">
        <CardTitle>Scan to connect your mobile device</CardTitle>
        <CardDescription className="text-balance">
          Open the Ledger mobile app and scan this code to link your device.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
