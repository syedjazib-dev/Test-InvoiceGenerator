import { BtnText } from "src/assets/static_data/BtnText"
import { Color } from "src/assets/static_data/Color"

export default interface Alert {
    title: string
    okBtnText: BtnText,
    cancelBtnText: BtnText,
    okBtnColor: Color
    msg: string
}