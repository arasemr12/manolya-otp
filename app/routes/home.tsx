import { Delete, Download, Plus, QrCode, TrainTrack, Trash, Upload } from "lucide-react";
import type { Route } from "./+types/home";
import { getRemaningTimeForOtpReset } from "~/lib/otp";
import { useEffect, useRef, useState } from "react";
import { generate, generateSecret } from "otplib";
import CreateModal from "~/components/CreateModal";
import { Html5QrcodeScanner } from "html5-qrcode";
import type { Otp } from "~/types";
import { Loading } from "~/components/Loading";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Manolya OTP" },
    { name: "description", content: "Manolya OTP" },
  ];
}

const secret = "3OVXBQMJ23LNHTAHSNMYSYQIECROLQEQ";

export default function Home() {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [remainingTimePercent, setRemainingTimePercent] = useState<number>(0);

  const [createModal, setCreateModal] = useState<boolean>(false);

  const [otp, setOtp] = useState<Otp[]>([
    {
      name: "arasemr1234@gmail.com",
      issuer: "Binance.com",
      secret: "GPACYGPBIPPSKQ4FRG5E6GO5R7NNRXG2",
      code: "0",
    },
  ]);

  const [loading, setLoading] = useState<boolean>(true);

  const otpRef = useRef(otp);

  useEffect(() => {
    otpRef.current = otp;
  }, [otp]);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const resetOtpCodes = async (list: Otp[] = otpRef.current) => {
    const results = await Promise.allSettled(
      list.map((item) => generate({ secret: item.secret }))
    );

    const codeMap = new Map(
      list.map((item, i) => {
        const result = results[i];
        const code = result.status === "fulfilled" ? result.value : "-1";
        return [item.secret, code];
      })
    );

    setOtp((prev) =>
      prev.map((item) => ({
        ...item,
        code: codeMap.get(item.secret) ?? item.code,
      }))
    );
  };

  useEffect(() => {
    (async () => {
      try {
        let list = localStorage.getItem("list");
        if (!list) return;

        let json: Otp[] = JSON.parse(list);
        setOtp(json);

        await resetOtpCodes(json);

        setLoading(false);
      } catch (error) {

      }
    })();

    let frameId: number;
    let lastCounter = -1;

    const tick = () => {
      const time = getRemaningTimeForOtpReset();
      setRemainingTime(time);
      setRemainingTimePercent((time / 30) * 100);

      const counter = Math.floor(Date.now() / 1000 / 30);
      if (counter !== lastCounter) {
        lastCounter = counter;
        resetOtpCodes();
      }

      frameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const copy = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch (error) {

    }
  };

  const exportOtp = () => {
    let data = JSON.stringify(otpRef.current, null, 2);

    let blob = new Blob([data], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = `${new Date().toISOString()}_manolyaotp.json`;

    a.click();
  };

  const importOtp = () => {
    let input: HTMLInputElement = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;

      const file = target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.readAsText(file);

      reader.addEventListener("loadend", () => {
        try {
          let result = reader.result as string;
          let json = JSON.parse(result);

          localStorage.setItem("list", result);

          setOtp(json);
          resetOtpCodes(json);
        } catch (error) {
          console.error("Incorrect json file:", error);
        }
      });
    });

    input.click();
  };

  const deleteOtp = (secret: string) => {
    try {
      let newList = otpRef.current.filter((e) => e.secret != secret);
      setOtp(newList);

      localStorage.setItem("list", JSON.stringify(newList));
    } catch (error) {

    }
  };

  const createOtp = ({ issuer, name, secret }: { issuer: string, name: string, secret: string }) => {
    let list = [...otpRef.current];

    list.unshift({
      name,
      issuer,
      secret,
      code: "0",
    });

    localStorage.setItem("list", JSON.stringify(list));

    setOtp(list);
    resetOtpCodes(list);
  };

  const scanQRCode = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      return scannerRef.current = null;
    }

    let html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } }, false);

    scannerRef.current = html5QrcodeScanner;

    html5QrcodeScanner.render((decodedText, decodedResult) => {
      console.log(`Code matched = ${decodedText}`, decodedResult);
      try {
        let url = new URL(decodedText);
        const secret = url.searchParams.get("secret");
        const issuer = url.searchParams.get("issuer") || "";
        const name = url?.pathname || "";

        if (!secret) return;

        createOtp({ issuer, name, secret });
      } catch (error) {

      }

      scannerRef.current = null;
      html5QrcodeScanner.pause();
      setTimeout(() => {
        html5QrcodeScanner.clear();
      }, 100);
    }, (a) => {
      console.log(a);
    });
  };

  return (
    <>
      {loading && (
        <div className="fixed z-50 top-0 left-0 bg-black w-full h-full flex flex-col items-center justify-center gap-5 select-none">
          <span className="text-4xl font-bold">Loading</span>
          <Loading/>
        </div>
      )}
      <CreateModal active={createModal} close={() => setCreateModal(false)} create={createOtp} />
      <div className="w-full h-full flex flex-col items-center justify-between pt-32">
        <div className="lg:w-2/3 w-full flex flex-col items-start gap-3">
          <div id="reader"></div>
          <span>This website allows you to view your OTP codes in a completely secure manner, exclusively on your local computer. I recommend exporting the list and storing it in a secure vault. If the list is lost, you may be unable to access it again; therefore, please ensure you upload the list to the cloud.</span>
          <h1 className="text-2xl font-semibold">{remainingTime.toFixed(2)}</h1>
          <div className="flex flex-row items-center gap-3">
            <button onClick={importOtp} className="flex flex-row items-center gap-3"><Download />Import OTP List</button>
            <button onClick={exportOtp} className="flex flex-row items-center gap-3"><Upload />Export OTP List</button>
          </div>
          <div className="flex flex-row items-center gap-3">
            <button onClick={(e) => setCreateModal(true)} className="flex flex-row items-center gap-3"><Plus />Add</button>
            <button onClick={scanQRCode} className="flex flex-row items-center gap-3"><QrCode />Scan QR Code</button>
          </div>
          <div className="w-full flex flex-row flex-wrap items-center justify-between gap-5 mb-8">
            {otp.map((otpData) => (
              <div key={otpData.secret} onClick={() => copy(otpData?.code || "-1")} className="w-full lg:w-[calc(50%-10px)] bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer duration-300 overflow-hidden">
                <span className="h-[1px] w-full block rounded-full overflow-hidden">
                  <span className={`h-[1px] ${remainingTimePercent > 50 ? 'bg-purple-600' : 'bg-yellow-600'} block rounded-full overflow-hidden`} style={{ width: `${remainingTimePercent}%` }}></span>
                </span>
                <div className="p-6 flex flex-col items-start w-full">
                  <div className="w-full flex flex-row items-center justify-between">
                    <span className="text-xl font-semibold uppercase">{otpData?.issuer}</span>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      deleteOtp(otpData.secret);
                    }}><Trash /></button>
                  </div>
                  <span className="mb-4 opacity-50">{otpData?.name}</span>
                  {otpData.code && <span className="text-3xl font-bold">{otpData.code.slice(0, 3) + " " + otpData.code.slice(3)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-2/3 w-full pb-4">
          <a href="https://github.com/arasemr12" target="_blank" className="text-xl font-semibold">Made by Emrah Aras (arasemr1234) with ❤️</a>
        </div>
      </div>

    </>
  )
}
