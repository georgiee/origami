#include <packing>

uniform sampler2D texture;
varying vec2 vUV;

void main() {
  vec4 pixel = texture2D( texture, vUV );
  // if ( pixel.a < 0.9 ) discard;
  gl_FragData[ 0 ] = packDepthToRGBA( gl_FragCoord.z );
}