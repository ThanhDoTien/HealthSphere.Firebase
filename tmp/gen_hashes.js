const h = s => {
  let h = 0, n = s.trim().toLowerCase();
  for (let i = 0; i < n.length; i++) {
    h = (h << 5) - h + n.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
};
const suffix = ', realistic food photography, high resolution, professional lighting';
console.log('Breakfast:' + h('Sữa chua Hy Lạp, Yến mạch và Quả mọng' + suffix));
console.log('Lunch:' + h('Ức gà nướng, Gạo lứt và Bông cải xanh' + suffix));
console.log('Dinner:' + h('Phi lê Cá hồi áp chảo và Khoai lang' + suffix));
console.log('Snack:' + h('Sinh tố Protein và Chuối' + suffix));
