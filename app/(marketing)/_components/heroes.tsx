import Image from "next/image";

export const Heroes = () => {
  return (
    <div className="flex max-w-5xl flex-col items-center justify-center">
      <div className="flex items-center">
        <div className="relative h-[450px] w-[800px] bg-cover bg-center" style={{ backgroundImage: 'url(/assets/images/reading.png)' }}>
        </div>
      </div>
    </div>
  );
};