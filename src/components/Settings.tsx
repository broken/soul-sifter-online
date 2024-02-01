import { Show, type Component, createSignal, createEffect } from "solid-js";

const Settings: Component = () => {
  const [theme, setTheme] = createSignal('soul');
  createEffect(() => {
    document.querySelector('html')!.setAttribute('data-theme', theme());
  });
  return (
    <Show when={true}>
      <div class="absolute h-screen w-screen bg-base-100 flex flex-col justify-center items-center">
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">Default</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onClick={() => setTheme('default')} value="default"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">light</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('light')} value="light"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">dark</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('dark')} value="dark"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">soul</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('soul')} value="soul"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">sifter</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('sifter')} value="sifter"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">acid</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('acid')} value="acid"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">aqua</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('aqua')} value="aqua"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">autumn</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('autumn')} value="autumn"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">black</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('black')} value="black"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">bumblebee</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('bumblebee')} value="bumblebee"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">business</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('business')} value="business"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">cmyk</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('cmyk')} value="cmyk"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">coffee</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('coffee')} value="coffee"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">corporate</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('corporate')} value="corporate"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">cupcake</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('cupcake')} value="cupcake"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">cyberpunk</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('cyberpunk')} value="cyberpunk"/>
          </label>
        </div>
        {/* <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">dracula</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('dracula')} value="dracula"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">emerald</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('emerald')} value="emerald"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">fantasy</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('fantasy')} value="fantasy"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">forest</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('forest')} value="forest"/>
          </label>
        </div> */}
        {/* <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">garden</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('garden')} value="garden"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">halloween</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('halloween')} value="halloween"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">lemonade</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('lemonade')} value="lemonade"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">lofi</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('lofi')} value="lofi"/>
          </label>
        </div> */}
        {/* <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">luxury</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('luxury')} value="luxury"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">night</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('night')} value="night"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">pastel</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('pastel')} value="pastel"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">retro</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('retro')} value="retro"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">synthwave</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('synthwave')} value="synthwave"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">valentine</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('valentine')} value="valentine"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">winter</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('winter')} value="winter"/>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-4">
            <span class="label-text">wireframe</span>
            <input type="radio" name="theme-radios" class="radio theme-controller" onclick={() => setTheme('wireframe')} value="wireframe"/>
          </label>
        </div> */}
      </div>
    </Show>
  );
};

export default Settings;
