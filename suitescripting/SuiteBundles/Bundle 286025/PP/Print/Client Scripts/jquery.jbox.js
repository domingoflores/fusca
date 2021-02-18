/**
 * @author Jason Foglia
 * 02/11/2011 9:03:45 AM - Modified 11/06/2012 10:03:45 AM
*/

;// Just in case someone forgot to end their statement
if (jq == null)// lets remove any doubt and spawn our own instance of jquery
    var jq = jQuery.noConflict();

(function ($j, window, document) {

    // Close button
    var img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAVVSURBVHjaxFdbSFxHGJ7djfdb1HgNpsV7iwQrYhWN5EmReHlqUEGqUcGHohBCMSqhqEgU8aWiqH0QBDGkAe2bF1ARMduKldqqsURFrVqtBo1uvOzu9P+n/znMWVfNWwc+zp455/zf/LdvZnXs8qGTrrbAwe2ASddrDdvOIfSEGwADQW9DagVYCGa6t9os4kpS5bdCgGSOCpqamj5PSUm5d+fOnS98fHyiHB0dg3U6HT8/P//r6Ojoj729PePy8vJIRkbGnLQQdh25johcADcBQYDQ4uLitNevX3eB4Q2r1coVbG1t8ZWVFS7PnZ6ewtTK856eniiypbskmuoDB4ArwBfwCSCmvr7+GzBiJIO8s7OTP3jwgLu6umqQnJzMW1pauMlkEuTg9eDo6Gg62bRLrHiIhLfQO0B8VVXVk83NzUU0Mjg4yKOioi6Q2eLu3bt8enpaEJ+cnBiHh4fTJY81QwmpLxEmpKWlPVpYWJjFj7u7u7mHh8e1hC4uLgLu7u68oaFBEIPng11dXdH2iJ0ohxjSeEDmy5cvf1I8vIpQIbKHtrY2Qfz27dvnxKGXSd2oaGIAaVB9Nbu7u3tQODw8PFxDkpiYyO/fv3+BICQkhJeWlnJfX191zsvLi6+vr4vigsKKt/XWm8KaDMiFghjAFba2tmoI4+Li1Cqtra1VjUdHR/ONjQ0x39HRoc47OzvzsrIyMT8zM1NJrSdI9XSDReSJC4iNjY3ABy9evNAk/vj4mEFxiN81NTXs6dOnLDQ0lI2MjLDg4GAx//79e8Y5F8AxMDDAgJRBxL609TQEiwfwFeBbWPXewcGB3fzl5OSobYHA95Tfr1694m5ubsJDGbOzs1jJS2Dbg0RHeOpAiUZvXSEvntvb2xovlZUPDQ2x3NxcdnZ2Ju6hyMS1v7+fFRUV/SdnBoMGkFfm4OBwmwjV8Cpy50RgIG0XCJUBYiHCKI/5+XlmsVjsSh3Ogw2drNt6W2Hf2dk5DgwMtGsAciO8hWiIe8wXDhASVllZafcbzDdEZlNWJr3tS4uLi+9A0MXLspcYSiQMCAhQQ/rw4UO1uKqrq1lJSYnGFoY3MjKSQfu9kef10naEW5NlfHx8Bx9kZWVpDODHMmFhYSED8WD5+fkqMWiw5pvU1FTm6enJlpaWfrXd7rBH7wG+BnwXExPzI1TwEe4icrMjsO8qKio4GBKVqgC2PF5XV8cjIiI08xMTExx3J2ivdFK9G3ZbBvB9Y2Pj79gGzc3NGlJsAdnoVYBQi1YyGo1dxKG2jIHE3pGu2DYukFcrSJ4P5Mx9dXWVzc3NqfnV6/XXnUZYQkIC6+vrY7BL/fzs2bNW2DywkE4ohdxAhPIpwenw8BALCj++CSt2MZvNbHJy8qNIsbh6e3vZ/v7+m/b29h9AGo0oaIBT6TShFXzAI1Q6DHNSUtIwkG1hmGC1PC8vj/v5+dkNZ2ZmJocThggpFM7s48ePn5DNIOJQZVBHgoCh9QL4AQLpRSzVW0FBQbfLy8s/Kygo+BTayA12DaxGBiIuVgyFx6CARJXCiWF/bGxsEmqhH3L5GzzeBRwAPqDmUJeopwblqOJFpwd/wi3ahdzh5BCUnZ0dAluff1hYmLe/vz+uHokO19bW/p6amvoTWukXqNhZmMa2+4cITURoUVpGUQmDzW7jI8GbKs+VomJQFI7yhEZRF98B9iUc0rMzmZBJfWOh1ZjooYWq7ZhW6y6RKt+YJdIjIjmgBRxJIbXYOx9x8tYsqYaFVmgiQwqhoySdVnpHITYR0QeaO7/s7PvRh23K+w0bUjMZP5Ngvu6w/b/8rfhXgAEAmJkyLSnsNQEAAAAASUVORK5CYII=";

    var body, d, c, con, h, close, wrap, sp, o, zindex = 1000;
    var methods = {
        init: function (options) {
            // Merge default options with incoming options
            o = $j.extend({}, {
                width: 600,
                content: "",
                button: {
                    width: 29,
                    height: 29,
                    src: img
                },
                close: null,
                modalclickclose: true,
                showCloseBtn: true
            }, options);

            // lets get body
            body = $j("body", document);

            sp = $j("<p />").css({
                "clear": "both",
                padding: 0,
                margin: 0
            });

            // Setup the content div
            con = $j("<div />");
            if (o.content)
                con.html(o.content);

            // Wrap the content div and call this jbox prompt
            wrap = $j('<div id="jbox_prompt" />').css({
                "padding": 5
            }).append(con);

            var docHeight = $j(document).height();
            var winHeight = $j(window).height();

            // Setup the Modal
            d = $j('<div id="jbox" />').css({
                "position": "absolute",
                "top": 0,
                "left": 0,
                width: '100%',
                height: docHeight > winHeight ? docHeight : winHeight,
                "background-color": "black",
                "opacity": "0.4",
                "filter": "alpha(opacity=40)",
                "z-index": zindex++
            });

            // Setup the prompt box
            c = $j("<div />").css({
                "position": "absolute",
                "left": (body.width() / 2 - o.width / 2),
                "background-color": "white",
                width: o.width,
                "opacity": "1",
                "filter": "alpha(opacity=100)",
                "box-shadow": " 0px 3px 5px lightgray",
                "z-index": zindex++
            }).hide();

            body.prepend(d);
            d.hide().fadeIn("slow");
            body.append(c);

            // Setup the header/title
            h = $j("<div />").css({
                "background-color": "whitesmoke",
                "position":"relative",
                "width": "100%",
                "font-weight": "bold",
                "height": o.button.height + 10,
                "line-height": (o.button.height + 5)+ 'px',
                "border-bottom": "2px solid lightgray",
                "font-size":"12px"
            });

            if (o.header){
            	var _ss = $j("<span />");
            	_ss.css({padding:5});
            	_ss.text(o.header);
                h.append(_ss);
            }

            if (o.showCloseBtn) {
                // Setup the close button
                var cbtn = $j('<input type="image" src="' + o.button.src + '" name="image" width="' + o.button.width + '" height="' + o.button.height + '" />')
                    .css({
                        width: o.button.width,
                        height: o.button.height,
                        //"float": "right",
                        "position": "absolute",
                        "right":"1px",
                        "margin": 5,
                        "border-collapse": "collapse",
                        "border": "0"
                    })
                    .click(methods.destroy);
                h.append(
                    cbtn
                );
            }

            c.append(h)
            .append(sp.clone())
            .append(wrap)
            .append(sp.clone())
            .css("top", ($j(window).height() / 2 - c.height() / 2))
            .fadeIn("slow");

            // this is useful when content is added after initialization of jbox to reposition and/or resize the prompt box
            con.unbind().bind('contentAdded', this, function (event) {
                methods.reposition();
            });

            // Allow dragging if true
            if (o.draggable) {
                if ($.fn.draggable) {
                    h.css("cursor", "pointer");
                    c.draggable();
                }
            }

            // Click the Modal to close the Modal
            if (o.modalclickclose)
                d.click(methods.destroy);

            $j(window).resize(methods.reposition);
            $j(window).scroll(methods.reposition);
            methods.reposition();

            // Use jQueries native ajax to load content
            if (o.ajax) {
                con.append("Loading...");
                con.load(o.ajax.url, o.ajax.data, function () {
                    con.hide().show("slow", methods.reposition);
                    if (o.complete)
                        o.complete(con);
                })
            } else
                if (o.complete)
                    o.complete(con);
        },
        destroy: function (arg) {
            var content = con.html();
            $j(window).unbind("resize");
            $j(window).unbind("scroll");

            d.fadeOut("normal", function () {
                d.remove();
            });
            c.fadeOut("normal", function () {
                c.remove();
            });
            if (o.close)
                o.close(content, arg);
        },
        reposition: function (e) {
            var w = c.width();
            var h = c.outerHeight();
            var windowH = $j(window).height();

            var docHeight = $j(document).height();
            var winHeight = $j(window).height();
            
            var top = (windowH / 2 - c.height() / 2) + $j(window).scrollTop();

            if (h > windowH) {
                h = windowH - 100;
                top = 25;
                con.css({
                    "overflow": "auto",
                    "height": h
                });
            } else {
                con.css({
                    "overflow": "",
                    "height": "auto"
                });
            }

            try {
                if (e != null && e.type != "scroll") {
                    c.animate({
                        "top": top,
                        "left": ($j(window).width() / 2 - c.width() / 2),
                        "width": w
                    }, {
                        duration: 700,
                        "easing": "swing"
                    });
                } else
                    c.css({
                        "top": top,
                        "left": ($j(window).width() / 2 - c.width() / 2),
                        "width": w
                    });
            } catch (ex) {
                console.log(ex);
            }

            d.css({
                'height': docHeight > winHeight ? docHeight : winHeight
            });

            if (e != null) {
                if (Object.prototype.toString.call(e.stopImmediatePropagation) == "[object Function]")
                    e.stopImmediatePropagation();
            }
        }
    };

    $j.fn.jbox = function (method) {
        if (methods[method])
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        else if (typeof method === 'object' || !method)
            return methods.init.apply(this, arguments);
        else
            $j.error('Method ' + method + ' does not exist on jQuery.jbox');
    };

})(jq, window, document);