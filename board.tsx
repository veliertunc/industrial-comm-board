import { mcuPins } from "./mcu-pins"

const GND = "GND"
const VDD = "V3V3"
const signals: Record<string, string> = {
  PA1: "ETH_REFCLK", PA2: "ETH_MDIO",
  PA4: "TFT_CS", PA5: "TFT_SCK", PA6: "TFT_MISO", PA7: "ETH_CRS_DV",
  PA9: "USB_VBUS_SENSE", PA11: "USB_DM", PA12: "USB_DP",
  PA13: "SWDIO", PA14: "SWCLK",
  PB0: "TFT_DC", PB1: "TFT_RESET", PB3: "SWO", PB5: "TFT_MOSI",
  PB8: "CAN_RX", PB9: "CAN_TX",
  PB6: "I2C_SCL", PB7: "I2C_SDA",
  PC1: "ETH_MDC", PC4: "ETH_RXD0", PC5: "ETH_RXD1",
  PC6: "RS485_TX", PC7: "RS485_RX", PC8: "RS485_DIR",
  PC0: "PHY_RESET", PC10: "UART_TX", PC11: "UART_RX",
  PD8: "RS232_TX", PD9: "RS232_RX",
  PG11: "ETH_TXEN", PG13: "ETH_TXD0", PG14: "ETH_TXD1",
  PH0: "HSE", NRST: "NRST", BOOT0: "BOOT0",
  VSSA: GND, VSS: GND, VDD, VBAT: VDD, VDDUSB: VDD, PDR_ON: VDD,
  VDDA: "VDDA", VREFP: "VDDA", VCAP_1: "VCAP1", VCAP_2: "VCAP2",
}

const endpoint = (name: string, pin: number, net: string) =>
  <trace key={`${name}-${pin}`} from={`.${name} > .pin${pin}`} to={`net.${net}`} />

type PartProps = {
  name: string
  part?: string
  footprint: string
  pins: string[]
  nets: (string | null)[]
  x: number
  y: number
}

function Part({ name, part, footprint, pins, nets, x, y }: PartProps) {
  return <>
    <chip name={name} manufacturerPartNumber={part} footprint={footprint}
      pinLabels={Object.fromEntries(pins.map((label, index) => [index + 1, label]))}
      pcbX={x} pcbY={y} schX={x / 7} schY={y / 7} />
    {nets.map((net, index) => net && endpoint(name, index + 1, net))}
  </>
}

function Header({ name, nets, x, y }: {
  name: string; nets: string[]; x: number; y: number
}) {
  return <Part name={name} footprint={`pinrow${nets.length}_p2.54mm`}
    pins={nets} nets={nets} x={x} y={y} />
}

function Capacitor({ name, value, net, other = GND, x, y }: {
  name: string; value: string; net: string; other?: string; x: number; y: number
}) {
  return <>
    <capacitor name={name} capacitance={value} footprint="0603" pcbX={x} pcbY={y} />
    {endpoint(name, 1, net)}{endpoint(name, 2, other)}
  </>
}

function Resistor({ name, value, a, b, x, y }: {
  name: string; value: string; a: string; b: string; x: number; y: number
}) {
  return <>
    <resistor name={name} resistance={value} footprint="0603" pcbX={x} pcbY={y} />
    {endpoint(name, 1, a)}{endpoint(name, 2, b)}
  </>
}

function Mcu() {
  return <>
    <chip name="U1" manufacturerPartNumber="STM32F746ZGT6"
      pinLabels={Object.fromEntries(mcuPins.map((pin, index) => [index + 1, `${pin}_${index + 1}`]))}
      footprint={<footprint>
        {mcuPins.map((_, index) => {
          const side = Math.floor(index / 36)
          const offset = ((index % 36) - 17.5) * 0.5
          const x = [-10.85, offset, 10.85, -offset][side]
          const y = [-offset, -10.85, offset, 10.85][side]
          const horizontal = side % 2 === 0
          return <smtpad key={index} portHints={[`pin${index + 1}`]}
            shape="rect" pcbX={x} pcbY={y}
            width={horizontal ? 1.5 : 0.28} height={horizontal ? 0.28 : 1.5} />
        })}
      </footprint>} />
    {mcuPins.map((pin, index) => signals[pin] && endpoint("U1", index + 1, signals[pin]))}
  </>
}

export default function IndustrialCommBoard() {
  return <board width="110mm" height="85mm" routingDisabled>
    <Mcu />
    <Header name="J1_POWER" nets={[VDD, GND]} x={-45} y={34} />
    <Header name="J2_SWD" nets={[VDD, "SWDIO", GND, "SWCLK", "NRST", "SWO"]} x={-27} y={34} />
    <Header name="J3_UART" nets={["UART_TX", "UART_RX", GND]} x={-7} y={34} />
    <Header name="J4_TFT" nets={[VDD, GND, "TFT_SCK", "TFT_MOSI", "TFT_MISO", "TFT_CS", "TFT_DC", "TFT_RESET"]} x={25} y={34} />

    <chip name="Y1" manufacturerPartNumber="ASE-8.000MHZ-LC-T" pcbX={-18} pcbY={2}
      schX={-4} schY={2} pinLabels={{ 1: "OE", 2: "GND", 3: "OUT", 4: "VDD" }}
      footprint={<footprint>
        {([[-1.05, -0.825], [1.05, -0.825], [1.05, 0.825], [-1.05, 0.825]]).map(([x, y], i) =>
          <smtpad key={i} portHints={[`pin${i + 1}`]} shape="rect"
            pcbX={x} pcbY={y} width={1.3} height={1.1} />
        )}
      </footprint>} />
    {[VDD, GND, "HSE", VDD].map((net, i) => endpoint("Y1", i + 1, net))}
    <Resistor name="R1" value="10k" a="BOOT0" b={GND} x={-17} y={-4} />
    <Capacitor name="C1" value="100nF" net="NRST" x={-17} y={-7} />
    <Capacitor name="C2" value="2.2uF" net="VCAP1" x={2} y={-14} />
    <Capacitor name="C3" value="2.2uF" net="VCAP2" x={2} y={14} />
    <Capacitor name="C4" value="10uF" net={VDD} x={-40} y={30} />
    <Capacitor name="C5" value="10nF" net={VDD} x={-18} y={5} />
    <Resistor name="R2" value="0" a={VDD} b="VDDA" x={-16} y={9} />
    <Capacitor name="C6" value="1uF" net="VDDA" x={-16} y={12} />
    <Capacitor name="C7" value="100nF" net="VDDA" x={-16} y={15} />
    {mcuPins.filter(pin => pin === "VDD" || pin === "VDDUSB").map((_, i) =>
      <Capacitor key={i} name={`C${10 + i}`} value="100nF" net={VDD}
        x={i < 5 ? -8 + 4 * i : 15} y={i < 5 ? 17 : -10 + 4 * (i - 5)} />
    )}

    <Part name="U2" part="24LC256-I/SN" footprint="soic8" x={-32} y={16}
      pins={["A0", "A1", "A2", "VSS", "SDA", "SCL", "WP", "VCC"]}
      nets={[GND, GND, GND, GND, "I2C_SDA", "I2C_SCL", GND, VDD]} />
    <Resistor name="R3" value="4.7k" a="I2C_SDA" b={VDD} x={-37} y={20} />
    <Resistor name="R4" value="4.7k" a="I2C_SCL" b={VDD} x={-33} y={20} />
    <Capacitor name="C30" value="100nF" net={VDD} x={-28} y={20} />

    <Part name="U3" part="MAX3232ESE+" footprint="soic16" x={-37} y={-12}
      pins={["C1P", "VP", "C1N", "C2P", "C2N", "VM", "T2OUT", "R2IN", "R2OUT", "T2IN", "T1IN", "R1OUT", "R1IN", "T1OUT", "GND", "VCC"]}
      nets={["PUMP1P", "PUMPVP", "PUMP1N", "PUMP2P", "PUMP2N", "PUMPVM", null, GND, null, VDD, "RS232_TX", "RS232_RX", "RS232_RX_LINE", "RS232_TX_LINE", GND, VDD]} />
    <Capacitor name="C31" value="100nF" net="PUMP1P" other="PUMP1N" x={-44} y={-8} />
    <Capacitor name="C32" value="100nF" net="PUMP2P" other="PUMP2N" x={-44} y={-11} />
    <Capacitor name="C33" value="100nF" net="PUMPVP" x={-44} y={-14} />
    <Capacitor name="C34" value="100nF" net="PUMPVM" x={-44} y={-17} />
    <Capacitor name="C35" value="100nF" net={VDD} x={-30} y={-12} />
    <Header name="J5_RS232" nets={["RS232_TX_LINE", "RS232_RX_LINE", GND]} x={-43} y={-32} />

    <Part name="U4" part="THVD1450DR" footprint="soic8" x={-18} y={-22}
      pins={["RO", "RE_N", "DE", "DI", "GND", "A", "B", "VCC"]}
      nets={["RS485_RX", "RS485_DIR", "RS485_DIR", "RS485_TX", GND, "RS485_A", "RS485_B", VDD]} />
    <Resistor name="R5" value="10k" a="RS485_DIR" b={GND} x={-23} y={-20} />
    <Capacitor name="C36" value="100nF" net={VDD} x={-13} y={-22} />
    <Header name="J6_RS485" nets={["RS485_A", "RS485_B", GND]} x={-21} y={-32} />
    <Header name="JP1_RS485_TERM" nets={["RS485_A", "RS485_TERM"]} x={-15} y={-37} />
    <Resistor name="R6" value="120" a="RS485_TERM" b="RS485_B" x={-20} y={-37} />

    <Part name="U5" part="SN65HVD230DR" footprint="soic8" x={7} y={-22}
      pins={["D", "GND", "VCC", "R", "VREF", "CANL", "CANH", "RS"]}
      nets={["CAN_TX", GND, VDD, "CAN_RX", null, "CAN_L", "CAN_H", GND]} />
    <Capacitor name="C37" value="100nF" net={VDD} x={12} y={-22} />
    <Resistor name="R7" value="10k" a="CAN_TX" b={VDD} x={2} y={-22} />
    <Header name="J7_CAN" nets={["CAN_H", "CAN_L", GND]} x={5} y={-32} />
    <Header name="JP2_CAN_TERM" nets={["CAN_H", "CAN_TERM"]} x={10} y={-37} />
    <Resistor name="R8" value="120" a="CAN_TERM" b="CAN_L" x={5} y={-37} />

    <Header name="J8_RMII" x={32} y={17}
      nets={[VDD, GND, "ETH_REFCLK", "ETH_MDIO", "ETH_MDC", "ETH_CRS_DV",
        "ETH_RXD0", "ETH_RXD1", "ETH_TXEN", "ETH_TXD0", "ETH_TXD1", "PHY_RESET"]} />
    <Resistor name="R9" value="2.2k" a="ETH_MDIO" b={VDD} x={26} y={13} />
    <Resistor name="R10" value="10k" a="PHY_RESET" b={VDD} x={32} y={13} />
    <Capacitor name="C38" value="10uF" net={VDD} x={38} y={13} />

    <Header name="J9_USB_FS" nets={["USB_VBUS", "USB_DM", "USB_DP", GND]} x={32} y={-32} />
    <Resistor name="R11" value="33k" a="USB_VBUS" b="USB_VBUS_SENSE" x={27} y={-25} />
    <Resistor name="R12" value="47k" a="USB_VBUS_SENSE" b={GND} x={32} y={-25} />
  </board>
}
