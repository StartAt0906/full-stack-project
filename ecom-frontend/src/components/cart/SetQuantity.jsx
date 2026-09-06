import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
const btnStyles = "border-[1.2px] border-slate-800 px-3 py-1 rounded";
const SetQuantity = ({
    quantity,
    cardCounter,
    handleQtyIncrese,
    handleQtyDecrease,
}) => {
   
    return (
        
    <div className="flex gap-8 items-center">
        {cardCounter ? null : <div className="font-semibold">Quantity</div>}
        <div className="flex md:flex-row flex-col gap-4 items-center lg:text-[22px] text-sm">
            <button
                disabled={quantity<=1}
                className={btnStyles}
                onClick={handleQtyDecrease}>
                -  
            </button>
                <div>{quantity}</div>
            <button
                className={btnStyles}
                onClick={handleQtyIncrese}>
                +
            </button>
        </div>
    </div>
    );
};

export default SetQuantity;