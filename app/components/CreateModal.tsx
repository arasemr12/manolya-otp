import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import type { Otp } from "~/types";

export default function CreateModal({active,close,create}:{active:boolean,close:() => void,create:({name,issuer,id,secret,algorithm,digits,code,period}:Otp) => void}){
    const [issuer,setIssuer] = useState<string>("");
    const [name,setName] = useState<string>("");
    const [secret,setSecret] = useState<string>("");

    const createOtp = () => {
        create({issuer,name,secret,id:v4(),code:"-1"});
        setIssuer("");
        setName("");
        setSecret("");
        close();
    };

    useEffect(() => {
        document.addEventListener("keydown",(e) => {
            if(e.code == "Escape"){
                close();
            }
        });
    },[]);

    return (
        <div className={`w-screen h-screen z-50 bg-black/30 backdrop-blur-sm fixed top-0 left-0 flex duration-300 ${active ? 'opacity-100 visible' : 'opacity-0 invisible'} items-center justify-center`}>
            <div className={`lg:w-2/3 lg:h-2/3 w-full h-full bg-gray-900 rounded-lg flex flex-col items-start border-2 border-gray-600 duration-300 absolute ${active ? 'scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'scale-0 left-0! top-0!'}`}>
                <div className="w-full py-2 px-4 flex flex-row items-center justify-between border-b-2 border-gray-600">
                    <span className="text-2xl font-semibold">Create OTP</span>
                    <button onClick={close} className="relative w-8 h-8 bg-red-600! hover:bg-red-800! p-0!"><X width={16} height={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/></button>
                </div>
                <div className="flex flex-col items-start p-6 gap-5">
                    <input value={issuer} onChange={(e) => setIssuer(e.target.value)} type="text" placeholder="issuer" />
                    <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="name" />
                    <input value={secret} onChange={(e) => setSecret(e.target.value)} type="text" placeholder="secret" />
                    <button onClick={createOtp}>Create</button>
                </div>
            </div>
        </div>
    )
}
