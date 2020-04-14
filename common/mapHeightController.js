let heights = {
  femaleVerified: 360,
  femaleVerifiedless: 555,
  maleShowMainBtn: 465,
  maleShowMainBtnDynamic: 555,
  maleShowMainBtnless: 360,   //非强输
}
export default function (){
  let height;
  if(this.data.isClickFemale){
    if(this.isVerified != '0'){
      height = heights.femaleVerified;
    } else {
      height = heights.femaleVerifiedless;
    }
  } else {
    if(!this.data.showMainBtn){
      height = heights.maleShowMainBtnless;
    } else {
      if(this.data.showDynamic){
        height = heights.maleShowMainBtnDynamic;
      }else{
        height = heights.maleShowMainBtn;
      }
    }
  }
  return height;
}