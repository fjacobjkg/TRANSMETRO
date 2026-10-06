import logo from "../assets/logo-transmetro.png";
export function BrandLogo() {
  return <span className="brand-identity" aria-label="Transmetro, control interno">
    <span className="brand-mark"><img src={logo} alt="" /></span>
    <span className="brand-copy"><strong>transmetro</strong><small>CONTROL INTERNO</small></span>
  </span>;
}
